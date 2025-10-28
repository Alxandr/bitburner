import type { NS } from "@ns";
import { disableLog } from "./disable-log";

export const hackingLevel = async (ns: NS, level: number): Promise<void> => {
  using _disableLog = disableLog(ns, "getPlayer", "sleep");

  ns.print(`Waiting for hacking level ${level}...`);
  while (ns.getPlayer().skills.hacking < level) {
    await ns.sleep(10_000);
  }
};
