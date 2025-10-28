import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveAlgorithmicStockTraderII: ContractSolver<
  CodingContractName.AlgorithmicStockTraderII
> = (prices: number[]) => {
  let maxProfit = 0;

  for (let i = 1; i < prices.length; i++) {
    maxProfit += Math.max(0, prices[i]! - prices[i - 1]!);
  }

  return maxProfit;
};
