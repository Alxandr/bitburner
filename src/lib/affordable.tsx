import type { NS } from "@ns";
import { disableLog } from "@lib/disable-log";

export const affordable = async (ns: NS, cost: number): Promise<void> => {
  using _logDisabled = disableLog(ns, "getServerMoneyAvailable", "sleep");

  ns.print(`Waiting for \$${ns.formatNumber(cost)}`);
  while (ns.getServerMoneyAvailable("home") < cost) {
    await ns.sleep(10_000);
  }
};
