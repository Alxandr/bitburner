import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

export const solveFindLargestPrimeFactor: ContractSolver<
  CodingContractName.FindLargestPrimeFactor
> = (inputNumber: number) => {
  let remainingNumber = inputNumber;
  let largestPrimeFactorFound = 1;

  while (remainingNumber % 2 === 0) {
    largestPrimeFactorFound = 2;
    remainingNumber /= 2;
  }

  let currentFactor = 3;
  while (currentFactor * currentFactor <= remainingNumber) {
    while (remainingNumber % currentFactor === 0) {
      largestPrimeFactorFound = currentFactor;
      remainingNumber /= currentFactor;
    }
    currentFactor += 2;
  }

  if (remainingNumber > 1) {
    largestPrimeFactorFound = remainingNumber;
  }

  return largestPrimeFactorFound;
};
