import type { CodingContractSignatures, CodingContractObject } from "@ns";

export type ContractSolver<K extends keyof CodingContractSignatures> = (
  contract: CodingContractSignatures[K][0],
) => CodingContractSignatures[K][1];
