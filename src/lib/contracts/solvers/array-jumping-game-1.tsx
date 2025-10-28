import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveArrayJumpingGameI: ContractSolver<
  CodingContractName.ArrayJumpingGame
> = (data: number[]) => {
  const n = data.length;
  let reach = 0;

  for (let i = 0; i < n && i <= reach; i++) {
    reach = Math.max(reach, i + data[i]!);
    if (reach >= n - 1) return 1;
  }

  return 0;
};
