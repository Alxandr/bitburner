import { type } from "arktype";

export const MessageId = type("number#messageId");
export type MessageId = typeof MessageId.infer;

export const BitBurnerResponseMessage = type({
  jsonrpc: "'2.0'",
  id: MessageId,
}).merge(
  type({
    result: "unknown",
  }).or({
    error: "string",
  }),
);
export type BitBurnerResponseMessage = typeof BitBurnerResponseMessage.infer;

export type RPCResponseHandler = {
  (result: unknown): void;
  error(error: Error): void;
};

export type RPCService<Result, Params> = {
  readonly name: string;
  readonly params: type.Any<Params>;
  readonly result: type.Any<Result>;

  readonly createMessage: (id: MessageId, params: Params) => string;
  readonly createHandler: (
    resolve: (result: Result) => void,
    reject: (error: Error) => void,
  ) => RPCResponseHandler;
};

function service<const Result, const Params>(
  name: string,
  params: type.Any<Params>,
  result: type.Any<Result>,
): RPCService<Result, Params> {
  const createMessage = (id: MessageId, params: Params) => {
    return JSON.stringify({
      jsonrpc: "2.0",
      method: name,
      params,
      id,
    });
  };

  const createHandler = (
    resolve: (result: Result) => void,
    reject: (error: Error) => void,
  ) => {
    const handler = (value: unknown) => {
      const parsed = result(value);
      if (parsed instanceof type.errors) {
        reject(parsed.toTraversalError());
      } else {
        resolve(parsed as Result);
      }
    };

    handler.error = (error: Error) => {
      reject(error);
    };

    return handler;
  };

  return Object.freeze({
    name,
    params,
    result,
    createMessage,
    createHandler,
  });
}

const OK = type("'OK'");

const FileServer = type({
  server: "string",
});

const FilePath = FileServer.and({
  filename: "string",
});

const FileContent = FilePath.and({
  content: "string",
});

export const services = Object.freeze({
  getDefinitionFile: service(
    "getDefinitionFile",
    type("undefined"),
    type("string"),
  ),
  getFileNames: service("getFileNames", FileServer, type("string[]")),
  deleteFile: service("deleteFile", FilePath, OK),
  pushFile: service("pushFile", FileContent, OK),
});
