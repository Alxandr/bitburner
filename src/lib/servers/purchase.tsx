import { affordable } from "@lib/affordable";
import type { NS } from "@ns";

export const serverHostname = (index: number) =>
  `priv-${index.toString().padStart(2, "0")}`;

export const hasMaxPurchsedServers = (ns: NS) => {
  const limit = ns.getPurchasedServerLimit();
  let servers = ns.getPurchasedServers();

  return servers.length >= limit;
};

export const purchaseSingleServer = async (
  ns: NS,
  memory: number,
): Promise<string> => {
  let servers = ns.getPurchasedServers();
  const nextIndex = servers.length;
  const hostname = serverHostname(nextIndex);
  const cost = ns.getPurchasedServerCost(memory);

  await affordable(ns, cost);
  const result = ns.purchaseServer(hostname, memory);
  if (!result) {
    throw new Error(`Failed to purchase server ${hostname}`);
  }

  return hostname;
};
