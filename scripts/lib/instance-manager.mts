import type { Builder, BuilderFile } from "./builder.mts";
import { Deferred } from "./defer.mts";
import { createLogger } from "./log.mts";
import { EventQueue } from "./queue.mts";
import type { ClientId, SyncServer } from "./sync-server.mts";

const log = createLogger("instance-manager");

export class InstanceManager implements Disposable {
  static async create(
    server: SyncServer,
    id: ClientId,
    builderPromise: Promise<Builder>,
    builderReadyPromise: Promise<void>,
    deferredDefinitionFile: Deferred<string>,
  ) {
    const definitionFile = await server.getDefinitionFile(id);
    deferredDefinitionFile.resolve(definitionFile);

    const builder = await builderPromise;
    await builderReadyPromise;

    const manager = new InstanceManager(server, id, builder);
    const onDisconnect = (cid: ClientId) => {
      if (cid !== id) return;
      manager[Symbol.dispose]();
      server.off("disconnect", onDisconnect);
    };

    server.on("disconnect", onDisconnect);
  }

  readonly #log: typeof log;
  readonly #server: SyncServer;
  readonly #clientId: ClientId;
  readonly #builder: Builder;
  readonly #queue = new EventQueue();
  readonly #ready = new Deferred<void>();

  readonly #onFileBuilt: (file: BuilderFile) => void;
  readonly #onFileDeleted: (path: string) => void;

  constructor(server: SyncServer, clientId: ClientId, builder: Builder) {
    this.#log = log.child({ clientId });
    this.#server = server;
    this.#clientId = clientId;
    this.#builder = builder;
    this.#queue = new EventQueue();

    this.#onFileBuilt = (file: BuilderFile) => {
      this.#queue.push(file.path, () => this.#updateFile(file));
    };

    this.#onFileDeleted = (path: string) => {
      this.#queue.push(path, () => this.#delete(path));
    };

    this.#builder.on("built", this.#onFileBuilt);
    this.#builder.on("deleted", this.#onFileDeleted);
    this.#start();
  }

  async #start() {
    try {
      const fileNames = await this.#server.getFileNames(this.#clientId, "home");
      const scripts = fileNames
        .filter((f) => f.startsWith("scripts/"))
        .map((f) => f.substring("scripts/".length));

      for (const script of scripts) {
        const file = this.#builder.file(script);
        if (!file) {
          // File only exists in the game, not locally. Delete it.
          this.#queue.push(script, () => this.#delete(script));
        }
      }

      for (const file of this.#builder.files) {
        this.#queue.push(file.path, () => this.#updateFile(file));
      }

      this.#ready.resolve();
    } catch (error) {
      this.#ready.reject(error);
    }
  }

  async #updateFile(file: BuilderFile) {
    await this.#ready.promise;
    this.#log.info(`Updating file: %s`, file.path);

    const content = await file.content;
    if (content === null) return;

    await this.#server.pushFile(
      this.#clientId,
      "home",
      `scripts/${file.path}`,
      content,
    );
  }

  async #delete(file: string) {
    await this.#ready.promise;
    this.#log.info(`Deleting file: %s`, file);
    await this.#server.deleteFile(this.#clientId, "home", `scripts/${file}`);
  }

  [Symbol.dispose]() {
    this.#builder.off("built", this.#onFileBuilt);
    this.#builder.off("deleted", this.#onFileDeleted);
  }
}
