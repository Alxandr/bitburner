import type { CodingContractName } from "@ns";
import type { ContractSolver } from "../types";

const isValidSegment = (segment: string) => {
  if (segment.length > 1 && segment.startsWith("0")) return false;
  return parseInt(segment) <= 255;
};

const backtrack = (
  ip: string,
  start: number,
  path: readonly string[],
  result: string[],
) => {
  if (path.length === 4 && start === ip.length) {
    result.push(path.join("."));
    return;
  }

  if (path.length >= 4) return;

  for (let i = 1; i <= 3; i++) {
    if (start + i > ip.length) break;

    const segment = ip.substring(start, start + i);
    if (!isValidSegment(segment)) continue;

    backtrack(ip, start + i, [...path, segment], result);
  }
};

export const solveGenerateIpAddresses: ContractSolver<
  CodingContractName.GenerateIPAddresses
> = (data) => {
  const result: string[] = [];
  backtrack(data, 0, [], result);

  return result;
};
