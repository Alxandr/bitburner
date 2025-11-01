import type { NS } from "@ns";

const SCRIPT_NAME = "scripts/managed/share.js";

export async function main(ns: NS): Promise<void> {
  const server = ns.getServer();
  const flags = ns.flags([
    ["server", server.hostname],
    ["ram", -1],
    ["debug", false],
  ]);

  const { server: hostServerName, ram, debug } = flags;
  if (debug) {
    ns.tprint(`Target Server: ${hostServerName}`);
    ns.tprint(`RAM: ${ram}`);
  }

  const hostServer = ns.getServer(hostServerName as string);
  const freeRam = hostServer.maxRam - hostServer.ramUsed;
  const ramToUse = ram === -1 ? freeRam : Math.min(ram as number, freeRam);

  if (hostServer.hostname !== "home") {
    ns.scp(SCRIPT_NAME, hostServer.hostname, "home");
  }

  const scriptMem = ns.getScriptRam(SCRIPT_NAME, hostServer.hostname);
  const maxThreads = Math.floor(ramToUse / scriptMem);

  if (maxThreads < 1) {
    ns.tprint(`Not enough RAM to run ${SCRIPT_NAME} on ${hostServerName}`);
    return;
  }

  ns.exec(SCRIPT_NAME, hostServer.hostname, { threads: maxThreads });
}
