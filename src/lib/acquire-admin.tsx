import type { NS, Server } from "@ns";
import { portPrograms } from "./port-programs";

export const acquireAdminRights = (ns: NS, server: Server): boolean => {
  if (typeof server.numOpenPortsRequired === "undefined") {
    ns.tprint(
      `Server '${server.hostname}' does not have numOpenPortsRequired set`,
    );
    return false;
  }

  const availablePortPrograms = portPrograms.filter((p) => p.available(ns));
  if (availablePortPrograms.length < server.numOpenPortsRequired) {
    return false;
  }

  for (const prog of availablePortPrograms) {
    if (!prog.isOpen(server) && !prog.open(ns, server)) {
      ns.tprint(`Failed to open ${prog.port} on server '${server.hostname}'`);
      return false;
    }
  }

  return ns.nuke(server.hostname);
};
