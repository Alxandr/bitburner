import type { NS, Server } from "@ns";
import { acquireAdminRights } from "@lib/acquire-admin";
import { canRunInitScript, initServer } from "@lib/init-server";

const checkServer = (ns: NS, server: Server): boolean => {
  if (!server.hasAdminRights && !acquireAdminRights(ns, server)) {
    return false;
  }

  if (!canRunInitScript(ns, server)) {
    return true;
  }

  const runningScripts = ns.ps(server.hostname);
  if (runningScripts.length === 0) {
    initServer(ns, server);
  }

  return true;
};

export async function main(ns: NS) {
  const queue = ["home"];
  const seen = new Set<string>(queue);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const server = ns.getServer(current);
    // ns.tprint(`visit '${current}'`);

    if (current !== "home") {
      if (!checkServer(ns, server)) {
        continue;
      }
    }

    const neighbors = ns.scan(current);
    for (const n of neighbors) {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
}
