import type { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const player = ns.getPlayer();
  ns.tprint(`karma: ${ns.formatNumber(player.karma)}`);
  ns.tprint(`killed: ${ns.formatNumber(player.numPeopleKilled)}`);
}
