import { affordable } from "@lib/affordable";
import type { NS } from "@ns";

export const canUpgradeServer = (ns: NS, maxMemory: number) => {
  const servers = ns.getPurchasedServers();
  return servers.some((hostname) => {
    const server = ns.getServer(hostname);
    return server.maxRam < maxMemory;
  });
};

export const upgradeServer = async (ns: NS): Promise<string | null> => {
  const servers = ns.getPurchasedServers().map((s) => ns.getServer(s));
  servers.sort((a, b) => a.maxRam - b.maxRam);
  const server = servers[0]!;

  const currentMem = server.maxRam;
  const newMem = currentMem * 2;
  const upgradeCost = ns.getPurchasedServerUpgradeCost(server.hostname, newMem);

  ns.print(`Next: upgrade ${server.hostname} to ${ns.formatRam(newMem)}`);
  await affordable(ns, upgradeCost * 10);
  const success = ns.upgradePurchasedServer(server.hostname, newMem);

  return success ? server.hostname : null;
};
