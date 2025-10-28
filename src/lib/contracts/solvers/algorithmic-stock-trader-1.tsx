import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveAlgorithmicStockTraderI: ContractSolver<
  CodingContractName.AlgorithmicStockTraderI
> = (prices: number[]) => {
  let min = prices[0]!;
  let maxProfit = 0;

  prices.forEach((value) => {
    min = Math.min(min, value);
    maxProfit = Math.max(maxProfit, value - min);
  });

  return maxProfit;
};
