import { initServer } from "@lib/init-server";
import {
  hasMaxPurchsedServers,
  purchaseSingleServer,
} from "@lib/servers/purchase";
import { canUpgradeServer, upgradeServer } from "@lib/servers/upgrade";
import type { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const flags = ns.flags([
    ["min", 8],
    ["max", ns.getPurchasedServerMaxRam()],
    ["debug", false],
  ]);

  const min = flags.min as number;
  const max = flags.max as number;
  const debug = flags.debug as boolean;
  if (debug) {
    ns.tprint(`min: ${ns.formatRam(min)}`);
    ns.tprint(`max: ${ns.formatRam(max)}`);
  }

  while (!hasMaxPurchsedServers(ns)) {
    const server = await purchaseSingleServer(ns, min);
    if (!initServer(ns, server)) {
      ns.toast(`Failed to initialize server ${server}`, "error");
      ns.exit();
    }
  }

  ns.print(`Provisioning complete, starting upgrading to ${ns.formatRam(max)}`);
  while (canUpgradeServer(ns, max)) {
    const server = await upgradeServer(ns);

    if (server === null) {
      ns.toast(`Failed to upgrade server`, "error");
      ns.exit();
    }

    ns.killall(server);
    initServer(ns, server);
  }
}
