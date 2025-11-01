import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveSubarrayWithMaximumSum: ContractSolver<
  CodingContractName.SubarrayWithMaximumSum
> = (data: number[]) => {
  let maxSum = data[0]!;
  let currentSum = data[0]!;

  for (let i = 1; i < data.length; i++) {
    currentSum = Math.max(data[i]!, currentSum + data[i]!);
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
};
