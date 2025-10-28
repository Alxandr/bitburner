import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveVigenereCipher: ContractSolver<
  CodingContractName.EncryptionIIVigenereCipher
> = ([s, k]: [string, string]) => {
  const key = k.repeat(Math.ceil(s.length / k.length)).slice(0, s.length);

  const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase();
  const vinegereSquare = alphabet.split("").map((_, index) => {
    return alphabet.slice(index) + alphabet.slice(0, index);
  });

  const result = s.split("").map((char, index) => {
    const rowIndex = alphabet.indexOf(key[index]!);
    return vinegereSquare[rowIndex]![alphabet.indexOf(char)]!;
  });

  return result.join("");
};
