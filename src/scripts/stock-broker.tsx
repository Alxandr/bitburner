import { sortBy } from "@lib/utils/sort-by";
import { sum } from "@lib/utils/sum";
import type { NS } from "@ns";

const MAX_INVESTMENT = 0.95;
const BUY_FORECAST_THRESHOLD = 0.65;
const SELL_FORECAST_THRESHOLD = 0.6;

type StockInfo = {
  readonly symbol: string;
  readonly maxShares: number;
  readonly forecast: number;
  readonly position: {
    readonly long: {
      readonly shares: number;
      readonly avgPrice: number;
      readonly totalPrice: number;
    };
    readonly short: {
      readonly shares: number;
      readonly avgPrice: number;
      readonly totalPrice: number;
    };
    readonly total: {
      readonly shares: number;
      readonly totalPrice: number;
    };
  };
};

const collectSharesData = (ns: NS): StockInfo[] =>
  ns.stock.getSymbols().map((symbol) => {
    const [sharesLong, avgLongPrice, sharesShort, avgShortPrice] =
      ns.stock.getPosition(symbol);
    const totalLongPrice = sharesLong * avgLongPrice;
    const totalShortPrice = sharesShort * avgShortPrice;

    return {
      symbol,
      maxShares: ns.stock.getMaxShares(symbol),
      forecast: ns.stock.getForecast(symbol),
      position: {
        long: {
          shares: sharesLong,
          avgPrice: avgLongPrice,
          totalPrice: totalLongPrice,
        },
        short: {
          shares: sharesShort,
          avgPrice: avgShortPrice,
          totalPrice: totalShortPrice,
        },
        total: {
          shares: sharesLong + sharesShort,
          totalPrice: totalLongPrice + totalShortPrice,
        },
      },
    };
  });

const log = (ns: NS, message: string) => {
  ns.print(message);
  //ns.tprint(message);
};

const getMaxPurchaseable = (
  ns: NS,
  symbol: string,
  money: number,
): [maxPurchaseable: number, cost: number] => {
  const askingPrice = ns.stock.getAskPrice(symbol);
  let max = Math.floor(
    (money - ns.stock.getConstants().StockMarketCommission) / askingPrice,
  );

  if (max <= 1000) return [0, 0];

  let purchaseCost;
  do {
    max--;
    if (max <= 0) return [0, 0];
    purchaseCost = ns.stock.getPurchaseCost(symbol, max, "Long");
  } while (purchaseCost > money);

  return [max, purchaseCost];
};

const buyStocks = (ns: NS, stocks: readonly StockInfo[], money: number) => {
  for (const sym of stocks) {
    if (sym.maxShares - sym.position.long.shares < 1000) continue;
    if (sym.forecast < BUY_FORECAST_THRESHOLD) break;

    const [maxPurchasable, cost] = getMaxPurchaseable(ns, sym.symbol, money);
    if (maxPurchasable < 1000) continue;

    const toBuy = Math.min(
      maxPurchasable,
      sym.maxShares - sym.position.long.shares,
    );
    const result = ns.stock.buyStock(sym.symbol, toBuy);
    if (result > 0) {
      money -= result * toBuy + ns.stock.getConstants().StockMarketCommission;
      log(
        ns,
        `Bought ${ns.formatNumber(toBuy)} shares of ${sym.symbol} for ${ns.formatNumber(cost)} (${ns.formatNumber(result)} per share)`,
      );
    } else {
      log(
        ns,
        `Failed to buy ${ns.formatNumber(toBuy)} shares of ${sym.symbol} for ${ns.formatNumber(cost)}`,
      );
    }
  }
};

const sellStocks = (ns: NS, stocks: readonly StockInfo[]) => {
  for (const sym of stocks) {
    if (sym.position.long.shares <= 0) continue;

    const potentialProfit =
      ns.stock.getSaleGain(sym.symbol, sym.position.long.shares, "Long") -
      sym.position.long.totalPrice;

    if (sym.forecast < SELL_FORECAST_THRESHOLD && potentialProfit > 0) {
      const result = ns.stock.sellStock(sym.symbol, sym.position.long.shares);
      if (result > 0) {
        log(
          ns,
          `Sold ${ns.formatNumber(sym.position.long.shares)} shares of ${sym.symbol} for ${ns.formatNumber(result * sym.position.long.shares)} (${ns.formatNumber(potentialProfit)} profit)`,
        );
      } else {
        log(
          ns,
          `Failed to sell ${ns.formatNumber(sym.position.long.shares)} shares of ${sym.symbol}`,
        );
      }
    }
  }
};

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  const consts = ns.stock.getConstants();
  while (true) {
    let shares = collectSharesData(ns);
    sellStocks(ns, shares);

    shares = collectSharesData(ns);
    sortBy(shares, (sym) => sym.forecast, "desc");
    // ns.print(`Best forecast: ${shares[0]!.symbol} (${shares[0]!.forecast})`);

    const moneyInMarket = sum(shares, (sym) => sym.position.total.totalPrice);
    const currentMoney = ns.getServerMoneyAvailable("home");
    const commision = consts.StockMarketCommission;
    const totalValue = moneyInMarket + currentMoney;
    const investable = totalValue * MAX_INVESTMENT - commision;
    // ns.print(`Money in market: ${ns.formatNumber(moneyInMarket)}`);
    // ns.print(`Current money: ${ns.formatNumber(currentMoney)}`);
    // ns.print(`Total value: ${ns.formatNumber(totalValue)}`);
    // ns.print(`Investable amount: ${ns.formatNumber(investable)}`);

    if (moneyInMarket < investable) {
      buyStocks(
        ns,
        shares,
        Math.min(
          currentMoney - commision,
          investable - moneyInMarket - commision,
        ),
      );
    }

    await ns.stock.nextUpdate();
  }
}
