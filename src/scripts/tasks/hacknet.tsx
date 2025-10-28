import { affordable } from "@lib/affordable";
import type { NS } from "@ns";

type HacknetAction = {
  threshold: number;
  describe: string;
  perform: (ns: NS) => boolean;
};

const getActions = (ns: NS): HacknetAction[] => {
  const ret: HacknetAction[] = [];

  const maxNodes = ns.hacknet.maxNumNodes();
  const currentNodes = ns.hacknet.numNodes();
  if (currentNodes < maxNodes) {
    const cost = ns.hacknet.getPurchaseNodeCost();
    ret.push({
      threshold: cost * 100, // only purchase when we have a lot of additional money
      perform: (ns: NS) => ns.hacknet.purchaseNode() > -1,
      describe: `Purchase hacknet node ${currentNodes + 1}`,
    });
  }

  for (let i = 0; i < currentNodes; i++) {
    const node = ns.hacknet.getNodeStats(i);
    const levelCost = ns.hacknet.getLevelUpgradeCost(i);
    const ramCost = ns.hacknet.getRamUpgradeCost(i);
    const coreCost = ns.hacknet.getCoreUpgradeCost(i);

    if (levelCost < Number.POSITIVE_INFINITY) {
      ret.push({
        threshold: levelCost * 1_000,
        perform: (ns: NS) => ns.hacknet.upgradeLevel(i),
        describe: `Upgrade hacknet node ${i + 1} to level ${node.level + 1}`,
      });
    }

    if (ramCost < Number.POSITIVE_INFINITY) {
      ret.push({
        threshold: ramCost * 10_000,
        perform: (ns: NS) => ns.hacknet.upgradeRam(i),
        describe: `Upgrade hacknet node ${i + 1} RAM`,
      });
    }

    if (coreCost < Number.POSITIVE_INFINITY) {
      ret.push({
        threshold: coreCost * 1_000_000,
        perform: (ns: NS) => ns.hacknet.upgradeCore(i),
        describe: `Upgrade hacknet node ${i + 1} cores`,
      });
    }
  }

  return ret;
};

const getNextAction = (ns: NS): HacknetAction | null => {
  const candidates = getActions(ns);
  let bestAction: HacknetAction | null = null;

  for (const action of candidates) {
    if (!bestAction || action.threshold < bestAction.threshold) {
      bestAction = action;
    }
  }

  return bestAction;
};

export async function main(ns: NS): Promise<void> {
  while (true) {
    const action = getNextAction(ns);
    if (!action) {
      break;
    }

    ns.print(`Next action: ${action.describe}`);
    ns.print(`threshold: \$${ns.formatNumber(action.threshold)}`);
    if (action.threshold > ns.getServerMoneyAvailable("home")) {
      // Cannot afford
      break;
    }

    if (!action.perform(ns)) {
      ns.toast(`Failed to ${action.describe}`, "warning");
      break;
    }
  }
}
