import type { CodingContractSignatures, CodingContractObject } from "@ns";
import type { ContractSolver } from "./types";
import { solveGenerateIpAddresses } from "./solvers/generate-ip-addresses";
import { solveVigenereCipher } from "./solvers/vigenere-cipher";
import { solveAlgorithmicStockTraderI } from "./solvers/algorithmic-stock-trader-1";
import { solveAlgorithmicStockTraderII } from "./solvers/algorithmic-stock-trader-2";
import { solveAlgorithmicStockTraderIII } from "./solvers/algorithmic-stock-trader-3";
import { solveAlgorithmicStockTraderIV } from "./solvers/algorithmic-stock-trader-4";
import { solveArrayJumpingGameI } from "./solvers/array-jumping-game-1";
import { solveArrayJumpingGameII } from "./solvers/array-jumping-game-2";
import { solveCaesarCipher } from "./solvers/caesar-cipher";

type ContractSolvers = {
  readonly [K in keyof CodingContractSignatures]?: ContractSolver<K>;
};

const solvers: ContractSolvers = {
  "Algorithmic Stock Trader I": solveAlgorithmicStockTraderI,
  "Algorithmic Stock Trader II": solveAlgorithmicStockTraderII,
  "Algorithmic Stock Trader III": solveAlgorithmicStockTraderIII,
  "Algorithmic Stock Trader IV": solveAlgorithmicStockTraderIV,
  "Array Jumping Game": solveArrayJumpingGameI,
  "Array Jumping Game II": solveArrayJumpingGameII,
  "Encryption I: Caesar Cipher": solveCaesarCipher,
  "Encryption II: Vigenère Cipher": solveVigenereCipher,
  "Generate IP Addresses": solveGenerateIpAddresses,
};

export const solveContract = (
  contract: CodingContractObject,
): string | false => {
  const solver = solvers[contract.type];
  if (!solver) return false;

  const result = (solver as ContractSolver<any>)(contract.data);
  return contract.submit(result);
};
