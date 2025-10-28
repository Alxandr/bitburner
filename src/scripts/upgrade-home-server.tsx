import { affordable } from "@lib/affordable";
import { disableLog } from "@lib/disable-log";
import type { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  using _disableLog = disableLog(
    ns,
    "getServerMaxRam",
    "getPurchasedServerMaxRam",
  );
  const maxRam = ns.getPurchasedServerMaxRam();

  let count = 0;
  while (ns.getServerMaxRam("home") < maxRam && count++ < 10) {
    const nextRam = ns.getServerMaxRam("home") * 2;
    const cost = ns.singularity.getUpgradeHomeRamCost();

    await affordable(ns, cost * 5);
    if (ns.singularity.upgradeHomeRam()) {
      ns.toast(`Home server upgraded to ${ns.formatRam(nextRam)}`);
    } else {
      ns.toast("Failed to upgrade home server", "error");
      ns.exit();
    }
  }
}
