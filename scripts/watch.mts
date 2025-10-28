import { Builder } from "./lib/builder.mts";
import path from "path";
import { SyncServer, type ClientId } from "./lib/sync-server.mts";
import { createLogger } from "./lib/log.mts";
import { Deferred } from "./lib/defer.mts";
import { InstanceManager } from "./lib/instance-manager.mts";

const log = createLogger("watch");

const baseDir = path.dirname(import.meta.dir);
const scriptsDir = path.join(baseDir, "src", "scripts");
const outDir = path.join(baseDir, "out");
const outScriptsDir = path.join(outDir, "scripts");
const dtsFile = Bun.file(path.join(baseDir, "NetScriptDefinitions.d.ts"));

const deferredBuilder = new Deferred<Builder>();
const deferredReady = new Deferred<void>();
const deferredDefinitionFile = new Deferred<string>();

using server = new SyncServer(12525);
server.on("connect", (id) => {
  log.info("Client connected: %d", id);

  InstanceManager.create(
    server,
    id,
    deferredBuilder.promise,
    deferredReady.promise,
    deferredDefinitionFile,
  );
});

server.on("disconnect", (id, code, reason) => {
  log.info("Client disconnected: %d - %d (%s)", id, code, reason);
});

const dts = await deferredDefinitionFile.promise;
await dtsFile.write(dts);

using builder = new Builder(scriptsDir, outScriptsDir);
builder.once("ready", () => {
  deferredReady.resolve();
  log.info("Builder ready");
});
deferredBuilder.resolve(builder);

await new Promise<void>((resolve) => process.once("SIGINT", resolve));
