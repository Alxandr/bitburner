import EventEmitter from "events";
import { type } from "arktype";
import {
  BitBurnerResponseMessage,
  MessageId,
  type RPCResponseHandler,
  type RPCService,
  services,
} from "./server/protocol.mts";
import { createLogger } from "./log.mts";

const IDLE_TIMEOUT = 10_000; // 10 seconds
const log = createLogger("sync-server");

const BitBurnerResponseMessageString = type("string.json.parse").to(
  BitBurnerResponseMessage,
);

const ClientId = type("number#clientId");
export type ClientId = typeof ClientId.infer;

const nextId = (() => {
  let num = 1;
  return () => num++;
})();

const nextClientId = () => ClientId.assert(nextId());
const nextMessageId = () => MessageId.assert(nextId());

type WsData = {
  readonly id: ClientId;
  readonly idleFn: () => void;
  idleTimeout: NodeJS.Timeout;
};

type SyncServerEvents = {
  connect: [id: ClientId];
  disconnect: [id: ClientId, code: number, reason: string];
  message: [id: ClientId, message: string | Buffer<ArrayBuffer>];
  error: [id: ClientId, error: Error];
};

export class SyncServer
  extends EventEmitter<SyncServerEvents>
  implements Disposable
{
  readonly #server: Bun.Server<WsData>;
  readonly #sockets: Map<ClientId, Bun.ServerWebSocket<WsData>> = new Map();
  readonly #inflight: Map<MessageId, RPCResponseHandler> = new Map();

  constructor(port: number) {
    super();
    EventEmitter.setMaxListeners(200, this);

    this.#server = Bun.serve({
      hostname: "127.0.0.1",
      port: port,
      fetch: (req, server) => {
        // upgrade the request to a WebSocket
        const id = nextClientId();
        const idleFn = () => {
          this.#idle(id);
        };
        const idleTimeout = setTimeout(idleFn, IDLE_TIMEOUT);
        if (server.upgrade(req, { data: { id, idleFn, idleTimeout } })) {
          return;
        }

        return new Response("Upgrade failed", { status: 500 });
      },

      websocket: {
        data: {} as WsData,
        message: (ws, message) => {
          const id = ws.data.id;
          log.debug(`message received from client %d`, id);
          this.emit("message", id, message);
        },
        open: (ws) => {
          const id = ws.data.id;
          log.debug(`client connected: %d`, id);
          this.#sockets.set(id, ws);
          this.emit("connect", id);
        },
        close: (ws, code, reason) => {
          const id = ws.data.id;
          log.debug(`client disconnected: %d`, id);
          this.#sockets.delete(id);
          this.emit("disconnect", id, code, reason);
        },
      },
    });

    log.info(
      "listening on port %s:%d",
      this.#server.hostname!,
      this.#server.port!,
    );

    this.on("message", (id, message) => {
      const json = message.toString();
      const parsed = BitBurnerResponseMessageString(json);
      if (parsed instanceof type.errors) {
        const error = parsed.toTraversalError();
        this.emit("error", id, error);
        return;
      }

      const requestId = parsed.id;
      const handler = this.#inflight.get(requestId);
      if (!handler) {
        // request probably timed out, regardless we ignore it
        return;
      }

      if ("error" in parsed) {
        const error = new Error(parsed.error);
        this.emit("error", id, error);
        handler.error(error);
        return;
      }

      handler(parsed.result);
    });
  }

  /**
   * Closes a connection.
   *
   * Here is a list of close codes:
   * - `1000` means "normal closure" **(default)**
   * - `1009` means a message was too big and was rejected
   * - `1011` means the server encountered an error
   * - `1012` means the server is restarting
   * - `1013` means the server is too busy or the client is rate-limited
   * - `4000` through `4999` are reserved for applications (you can use it!)
   *
   * @param code The close code to send
   * @param reason The close reason to send
   * @returns true if the connection was closed successfully, false otherwise
   */
  close(id: ClientId, code?: number, reason?: string): boolean {
    const socket = this.#sockets.get(id);
    if (!socket) return false;

    socket.close(code, reason);
    this.#sockets.delete(id);
    return true;
  }

  #idle(id: ClientId) {
    const socket = this.#sockets.get(id);
    if (!socket) return false;

    socket.ping();
    this.#resetPing(socket);
  }

  #resetPing(socket: Bun.ServerWebSocket<WsData>) {
    clearTimeout(socket.data.idleTimeout);
    socket.data.idleTimeout = setTimeout(socket.data.idleFn, IDLE_TIMEOUT);
  }

  async #send<const Result, const Params>(
    clientId: ClientId,
    service: RPCService<Result, Params>,
    params: Params,
  ): Promise<Result> {
    const socket = this.#sockets.get(clientId);
    if (!socket) {
      throw new Error(`Connection ${clientId} not found`);
    }

    const id = nextMessageId();
    let resolve: (value: Result) => void = null!;
    let reject: (error: Error) => void = null!;
    let responsePromise = new Promise<Result>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, 10_000);

    const onDisconnect = (cid: ClientId) => {
      if (cid === clientId) {
        reject(new Error("Disconnected"));
      }
    };

    this.on("disconnect", onDisconnect);

    this.#inflight.set(id, service.createHandler(resolve, reject));
    responsePromise = responsePromise.finally(() => {
      this.off("disconnect", onDisconnect);
      this.#inflight.delete(id);
      clearTimeout(timer);
    });

    const message = service.createMessage(id, params);
    socket.send(message);

    return responsePromise;
  }

  async getDefinitionFile(id: ClientId): Promise<string> {
    return await this.#send(id, services.getDefinitionFile, void 0);
  }

  async getFileNames(id: ClientId, server: string): Promise<readonly string[]> {
    return await this.#send(id, services.getFileNames, { server });
  }

  async deleteFile(
    id: ClientId,
    server: string,
    filePath: string,
  ): Promise<void> {
    await this.#send(id, services.deleteFile, {
      server,
      filename: filePath,
    });
  }

  async pushFile(
    id: ClientId,
    server: string,
    filePath: string,
    content: string,
  ): Promise<void> {
    await this.#send(id, services.pushFile, {
      server,
      filename: filePath,
      content,
    });
  }

  [Symbol.dispose]() {
    this.#server[Symbol.dispose]();
  }
}
