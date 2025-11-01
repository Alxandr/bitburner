import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

const isValid = (exp: string): boolean => {
  let balance = 0;
  for (const char of exp) {
    if (char === "(") balance++;
    else if (char === ")") {
      if (balance === 0) return false;
      balance--;
    }
  }
  return balance === 0;
};

export const solveSanitizeParenthesesInExpression: ContractSolver<
  CodingContractName.SanitizeParenthesesInExpression
> = (expression: string) => {
  let currentLevel = new Set([expression]);
  let foundValid = false;
  const validExpressions = new Set<string>();

  while (currentLevel.size > 0) {
    for (const exp of currentLevel) {
      if (isValid(exp)) {
        validExpressions.add(exp);
        foundValid = true;
      }
    }
    if (foundValid) return Array.from(validExpressions);
    const nextLevel = new Set<string>();
    for (const exp of currentLevel) {
      for (let i = 0; i < exp.length; i++) {
        if (exp[i] !== "(" && exp[i] !== ")") continue;
        nextLevel.add(exp.slice(0, i) + exp.slice(i + 1));
      }
    }
    currentLevel = nextLevel;
  }
  return [""];
};
