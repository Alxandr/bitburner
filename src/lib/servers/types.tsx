import type { Server } from "@ns";
import { type } from "arktype";

const Ram = type("number#ram");
const MaxRam = Ram.brand("max");
const UsedRam = Ram.brand("used");
const FreeRam = Ram.brand("free");

const Money = type("number#money");
const MoneyMax = Money.brand("max");
const MoneyAvailable = Money.brand("available");

const ServerGrowth = type("number#growth");

const Hostname = type("string#hostname");
const ServerIsHome = type("boolean#serverIsHome");

const ServerCores = type("number#cores");

const HasRoot = type("boolean#hasRoot");
const PortsRequired = type("number#portsRequired");
const LevelRequired = type("number#levelRequired");

const HackDifficulty = type("number#hackDifficulty");
const MinHackDifficulty = HackDifficulty.brand("min");

const ServerRamStatics = type({
  max: MaxRam,
});

const ServerSecurityStatics = type({
  hasRoot: HasRoot,
  portsRequired: PortsRequired,
  levelRequired: LevelRequired,
  minDifficulty: MinHackDifficulty,
});

const ServerMoneyStatics = type({
  max: MoneyMax,
  growth: ServerGrowth,
});

const PurchasedServerStatics = type({
  index: "number.integer >= 0",
});

export const ServerStatics = type({
  hostname: Hostname,
  isHome: ServerIsHome,
  purchased: PurchasedServerStatics.or("null"),
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
      index,
    };
  }

  return ServerStatics.assert({
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

export type Ram = typeof Ram.infer;
export type MaxRam = typeof MaxRam.infer;
export type UsedRam = typeof UsedRam.infer;
export type FreeRam = typeof FreeRam.infer;

export type Money = typeof Money.infer;
export type MaxMoney = typeof MoneyMax.infer;
export type AvailableMoney = typeof MoneyAvailable.infer;

export type ServerGrowth = typeof ServerGrowth.infer;

export type Hostname = typeof Hostname.infer;
export type ServerIsHome = typeof ServerIsHome.infer;
export type PurchasedServerStatics = typeof PurchasedServerStatics.infer;

export type ServerCores = typeof ServerCores.infer;

export type PortsRequired = typeof PortsRequired.infer;
export type LevelRequired = typeof LevelRequired.infer;

export type HackDifficulty = typeof HackDifficulty.infer;
export type MinHackDifficulty = typeof MinHackDifficulty.infer;

export type ServerRamStatics = typeof ServerRamStatics.infer;
export type ServerSecurityStatics = typeof ServerSecurityStatics.infer;
export type ServerMoneyStatics = typeof ServerMoneyStatics.infer;
export type ServerStatics = typeof ServerStatics.infer;
