import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveUniquePathsInAGridI: ContractSolver<
  CodingContractName.UniquePathsInAGridI
> = ([rows, columns]: [number, number]) => {
  let totalPaths = 1;
  for (let step = 1; step < rows; step++) {
    totalPaths = (totalPaths * (columns - 1 + step)) / step;
  }
  return totalPaths;
};
