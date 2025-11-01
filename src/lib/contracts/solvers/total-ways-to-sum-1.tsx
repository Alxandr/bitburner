import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveTotalWaysToSumI: ContractSolver<
  CodingContractName.TotalWaysToSum
> = (inputNumber: number) => {
  const targetNumber = inputNumber;
  const waysToSum: number[] = new Array(targetNumber + 1).fill(0);

  waysToSum[0] = 1;
  for (
    let currentSummand = 1;
    currentSummand <= targetNumber - 1;
    currentSummand++
  ) {
    for (
      let currentTotal = currentSummand;
      currentTotal <= targetNumber;
      currentTotal++
    ) {
      waysToSum[currentTotal]! += waysToSum[currentTotal - currentSummand]!;
    }
  }

  return waysToSum[targetNumber]!;
};
