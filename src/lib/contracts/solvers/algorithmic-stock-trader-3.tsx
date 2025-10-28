import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";
import { solveAlgorithmicStockTraderI } from "./algorithmic-stock-trader-1";

export const solveAlgorithmicStockTraderIII: ContractSolver<
  CodingContractName.AlgorithmicStockTraderIII
> = (prices: number[]) => {
  let max = 0;

  for (let i = 0; i < prices.length; i++) {
    max = Math.max(
      max,
      solveAlgorithmicStockTraderI(prices.slice(0, i)) +
        solveAlgorithmicStockTraderI(prices.slice(i)),
    );
  }

  return max;
};
