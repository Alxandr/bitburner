import { hackingLevel } from "@lib/hacking-level";
import { ServerRepository } from "@lib/servers/repository";
import type { ServerStatics } from "@lib/servers/types";
import { canUseFormulas } from "@lib/utils/can-use";
import { sortBy } from "@lib/utils/sort-by";
import type { NS, Player, Server } from "@ns";

const autohackScript = "scripts/autohack.js";

const getCandidates = async (ns: NS): Promise<ServerStatics[]> => {
  using repo = await ServerRepository.open();
  const monetaryServers = (await repo.getMonetaryServers()).filter(
    (s) => s.security.hasRoot,
  );
  const player = ns.getPlayer();

  if (canUseFormulas(ns)) {
    return getCandidatesFromFormulas(ns, monetaryServers, player);
  }

  return monetaryServers.filter((server) => {
    if (server.security.levelRequired >= player.skills.hacking / 2)
      return false;
    if (server.security.minDifficulty > 15) return false;
    return true;
  });
};

const getCandidatesFromFormulas = (
  ns: NS,
  monetaryServers: readonly ServerStatics[],
  player: Player,
): ServerStatics[] => {
  return monetaryServers.filter((server) => {
    const serverData = ns.getServer(server.hostname);
    serverData.hackDifficulty = serverData.minDifficulty;

    const hackChance = ns.formulas.hacking.hackChance(serverData, player);
    return hackChance > 0.9;
  });
};

const getTarget = async (ns: NS, host: Server): Promise<string> => {
  const candidates = await getCandidates(ns);

  if (candidates.length === 0) return "foodnstuff";
  sortBy(candidates, (s) => s.money.max, "desc");

  using repo = await ServerRepository.open();
  const hostStatics = await repo.get(host.hostname);
  if (hostStatics?.purchased) {
    const index = hostStatics.purchased!.index % candidates.length;
    return candidates[index]!.hostname;
  }

  return "foodnstuff";
};

const startAutohack = async (
  ns: NS,
  host: Server,
  target: Server,
): Promise<never> => {
  const requiredLevel = target.requiredHackingSkill;
  if (requiredLevel) {
    await hackingLevel(ns, requiredLevel);
  }

  ns.scp([autohackScript], host.hostname, "home");
  const scriptMem = ns.getScriptRam(autohackScript, host.hostname);
  const maxRam = ns.getServerMaxRam(host.hostname);
  const maxThreads = Math.floor(maxRam / scriptMem);

  ns.toast(`Starting autohack on ${host.hostname}`);
  ns.spawn(autohackScript, { threads: maxThreads }, target.hostname);
  ns.exit(); // unreachable
};

export async function main(ns: NS): Promise<void> {
  const currentServer = ns.getServer();
  if (currentServer.purchasedByPlayer || currentServer.moneyMax === 0) {
    // For now - just hack a random server
    const target = await getTarget(ns, currentServer);
    await startAutohack(ns, currentServer, ns.getServer(target));
  }

  await startAutohack(ns, currentServer, currentServer);
}
