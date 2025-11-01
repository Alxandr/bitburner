import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveTotalWaysToSumII: ContractSolver<
  CodingContractName.TotalWaysToSumII
> = ([targetSum, availableIntegers]: [number, number[]]) => {
  const waysToFormSum: number[] = Array(targetSum + 1).fill(0);
  waysToFormSum[0] = 1;

  for (const integerValue of availableIntegers) {
    for (let currentSum = integerValue; currentSum <= targetSum; currentSum++) {
      waysToFormSum[currentSum]! += waysToFormSum[currentSum - integerValue]!;
    }
  }

  return waysToFormSum[targetSum]!;
};
