import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

const backtrack = (
  digits: string,
  target: number,
  index: number,
  expression: string,
  currentValue: number,
  lastOperand: number,
  results: string[],
) => {
  if (index === digits.length) {
    if (currentValue === target) results.push(expression);
    return;
  }

  for (let i = index; i < digits.length; i++) {
    if (i > index && digits[index] === "0") break;
    const currentStr = digits.substring(index, i + 1);
    const currentNum = Number(currentStr);

    if (index === 0) {
      backtrack(
        digits,
        target,
        i + 1,
        currentStr,
        currentNum,
        currentNum,
        results,
      );
    } else {
      backtrack(
        digits,
        target,
        i + 1,
        `${expression}+${currentStr}`,
        currentValue + currentNum,
        currentNum,
        results,
      );
      backtrack(
        digits,
        target,
        i + 1,
        `${expression}-${currentStr}`,
        currentValue - currentNum,
        -currentNum,
        results,
      );
      backtrack(
        digits,
        target,
        i + 1,
        `${expression}*${currentStr}`,
        currentValue - lastOperand + lastOperand * currentNum,
        lastOperand * currentNum,
        results,
      );
    }
  }
};

export const solveFindAllValidMathExpressions: ContractSolver<
  CodingContractName.FindAllValidMathExpressions
> = ([digits, target]: [string, number]) => {
  const results: string[] = [];

  backtrack(digits, target, 0, "", 0, 0, results);
  return results;
};
