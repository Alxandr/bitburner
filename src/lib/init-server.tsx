import type { NS, Server } from "@ns";

const initScriptName = "scripts/server-init.js";

export const canRunInitScript = (ns: NS, server: string | Server): boolean => {
  const hostname = typeof server === "string" ? server : server.hostname;
  const maxMem = ns.getServerMaxRam(hostname);

  return maxMem >= 8;
};

export const initServer = (ns: NS, server: string | Server): false | number => {
  const hostname = typeof server === "string" ? server : server.hostname;
  if (!canRunInitScript(ns, server)) {
    ns.tprint(
      `Server ${hostname} has less than 8GB of RAM, not enough to run scripts`,
    );
    return false;
  }

  if (hostname !== "home") {
    ns.scp([initScriptName], hostname, "home");
  }

  const pid = ns.exec(initScriptName, hostname);
  if (pid === 0) {
    return false;
  }

  return pid;
};
