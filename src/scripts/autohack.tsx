import type { NS } from "@ns";

const WEAKEN_THESHOLD = 1.1;

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  const server = ns.args[0] as string;
  const minSec = ns.getServerMinSecurityLevel(server);
  const maxVal = ns.getServerMaxMoney(server);

  while (true) {
    const secLevel = ns.getServerSecurityLevel(server);
    const moneyAvailable = ns.getServerMoneyAvailable(server);
    if (secLevel > minSec * WEAKEN_THESHOLD) {
      ns.print(
        `weaken: ${server} sec: ${ns.formatNumber(secLevel)} > ${ns.formatNumber(minSec)}`,
      );
      await ns.weaken(server);
    } else if (moneyAvailable < maxVal) {
      ns.print(
        `grow: ${server} money: ${ns.formatNumber(moneyAvailable)} < ${ns.formatNumber(maxVal)}`,
      );
      await ns.grow(server);
    } else {
      const money = await ns.hack(server);
      ns.print(`hack: ${server} money: ${ns.formatNumber(money)}`);
    }
  }
}
