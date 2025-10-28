import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveCaesarCipher: ContractSolver<
  CodingContractName.EncryptionICaesarCipher
> = ([s, k]: [string, number]) => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase();

  const n = alphabet.length - k;
  const shiftedAlphabet = alphabet.slice(n) + alphabet.slice(0, n);

  return s
    .split("")
    .map((char) => {
      const index = alphabet.indexOf(char);
      return index === -1 ? char : shiftedAlphabet[index];
    })
    .join("");
};
