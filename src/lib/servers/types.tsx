import * as types from "@lib/utils/type-token/types";
import type { Server } from "@ns";

const Ram = types.number.brand("ram");
const MaxRam = Ram.brand("max");
const UsedRam = Ram.brand("used");
const FreeRam = Ram.brand("free");

const Money = types.number.brand("money");
const MoneyMax = Money.brand("max");
const MoneyAvailable = Money.brand("available");

const ServerGrowth = types.number.brand("growth");

const Hostname = types.string.brand("hostname");
const ServerIsHome = types.boolean.brand("serverIsHome");

const ServerCores = types.number.brand("cores");

const HasRoot = types.boolean.brand("hasRoot");
const PortsRequired = types.number.brand("portsRequired");
const LevelRequired = types.number.brand("levelRequired");

const HackDifficulty = types.number.brand("hackDifficulty");
const MinHackDifficulty = HackDifficulty.brand("min");

const ServerRamStatics = types.struct("ServerRamStatics", {
  max: MaxRam,
});

const ServerSecurityStatics = types.struct("ServerSecurityStatics", {
  hasRoot: HasRoot,
  portsRequired: PortsRequired,
  levelRequired: LevelRequired,
  minDifficulty: MinHackDifficulty,
});

const ServerMoneyStatics = types.struct("ServerMoneyStatics", {
  max: MoneyMax,
  growth: ServerGrowth,
});

const PurchasedServerStatics = types.struct("PurchasedServerStatics", {
  index: types.index,
});

export const ServerStatics = types.struct("ServerStatics", {
  hostname: Hostname,
  isHome: ServerIsHome,
  purchased: PurchasedServerStatics.or(types.null),
  ram: ServerRamStatics,
  security: ServerSecurityStatics,
  money: ServerMoneyStatics,
  cores: ServerCores,
});

export const serverStatics = (
  server: Server,
  purchasedServers: readonly string[],
): ServerStatics => {
  const isHome = server.hostname === "home";
  let purchasedStatics: PurchasedServerStatics | null = null;

  if (server.purchasedByPlayer && !isHome) {
    const index = purchasedServers.indexOf(server.hostname);
    if (index < 0) {
      throw new Error(
        `server ${server.hostname} not found in purchasedServers`,
      );
    }

    purchasedStatics = {
      index: types.index.cast(index),
    };
  }

  return ServerStatics.cast({
    hostname: server.hostname,
    isHome,
    purchased: purchasedStatics,
    ram: {
      max: server.maxRam,
    },
    security: {
      hasRoot: server.hasAdminRights,
      portsRequired: server.numOpenPortsRequired ?? 0,
      levelRequired: server.requiredHackingSkill ?? 1,
      minDifficulty: server.minDifficulty ?? 1,
    },
    money: {
      max: server.moneyMax ?? 0,
      growth: server.serverGrowth ?? 0,
    },
    cores: server.cpuCores,
  });
};

export type Ram = typeof Ram.type;
export type MaxRam = typeof MaxRam.type;
export type UsedRam = typeof UsedRam.type;
export type FreeRam = typeof FreeRam.type;

export type Money = typeof Money.type;
export type MaxMoney = typeof MoneyMax.type;
export type AvailableMoney = typeof MoneyAvailable.type;

export type ServerGrowth = typeof ServerGrowth.type;

export type Hostname = typeof Hostname.type;
export type ServerIsHome = typeof ServerIsHome.type;
export type PurchasedServerStatics = typeof PurchasedServerStatics.type;

export type ServerCores = typeof ServerCores.type;

export type PortsRequired = typeof PortsRequired.type;
export type LevelRequired = typeof LevelRequired.type;

export type HackDifficulty = typeof HackDifficulty.type;
export type MinHackDifficulty = typeof MinHackDifficulty.type;

export type ServerRamStatics = typeof ServerRamStatics.type;
export type ServerSecurityStatics = typeof ServerSecurityStatics.type;
export type ServerMoneyStatics = typeof ServerMoneyStatics.type;
export type ServerStatics = typeof ServerStatics.type;
