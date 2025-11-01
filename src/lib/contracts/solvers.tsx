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
import { solveSubarrayWithMaximumSum } from "./solvers/subarray-max-sum";
import { solveFindLargestPrimeFactor } from "./solvers/find-largest-prime-factor";
import { solveTotalWaysToSumI } from "./solvers/total-ways-to-sum-1";
import { solveTotalWaysToSumII } from "./solvers/spiralize-matrix";
import { solveSpiralizeMatrix } from "./solvers/total-ways-to-sum-2";
import { solveMergeOverlappingIntervals } from "./solvers/merge-overlapping-intervals";
import { solveMinimumPathSumInATriangle } from "./solvers/minimum-path-usm-in-triangle";
import { solveUniquePathsInAGridI } from "./solvers/unique-paths-in-grid-1";
import { solveUniquePathsInAGridII } from "./solvers/unique-paths-in-grid-2";
import { solveShortestPathInAGrid } from "./solvers/shortest-path-in-grid";
import { solveSanitizeParenthesesInExpression } from "./solvers/sanitize-parentheses-in-expression";
import { solveFindAllValidMathExpressions } from "./solvers/find-all-valid-math-expressions";
import { solveHammingCodesIntegerToEncodedBinary } from "./solvers/hamming-codes-integer-to-encoded-binary";
import { solveHammingCodesEncodedBinaryToInteger } from "./solvers/hamming-codes-encoded-binary-to-integer";
import { solveProper2ColoringOfAGraph } from "./solvers/proper-two-coloring-of-graph";
import { solveCompressionIRLECompression } from "./solvers/rle-compression";
import { solveCompressionIILZDecompression } from "./solvers/lz-decompression";
import { solveCompressionIIILZCompression } from "./solvers/lz-compression";
import { solveSquareRoot } from "./solvers/square-root";

type ContractSolvers = {
  readonly [K in keyof CodingContractSignatures]?: ContractSolver<K>;
};

const solvers: ContractSolvers = {
  "Find Largest Prime Factor": solveFindLargestPrimeFactor,
  "Subarray with Maximum Sum": solveSubarrayWithMaximumSum,
  "Total Ways to Sum": solveTotalWaysToSumI,
  "Total Ways to Sum II": solveTotalWaysToSumII,
  "Spiralize Matrix": solveSpiralizeMatrix,
  "Array Jumping Game": solveArrayJumpingGameI,
  "Array Jumping Game II": solveArrayJumpingGameII,
  "Merge Overlapping Intervals": solveMergeOverlappingIntervals,
  "Generate IP Addresses": solveGenerateIpAddresses,
  "Algorithmic Stock Trader I": solveAlgorithmicStockTraderI,
  "Algorithmic Stock Trader II": solveAlgorithmicStockTraderII,
  "Algorithmic Stock Trader III": solveAlgorithmicStockTraderIII,
  "Algorithmic Stock Trader IV": solveAlgorithmicStockTraderIV,
  "Minimum Path Sum in a Triangle": solveMinimumPathSumInATriangle,
  "Unique Paths in a Grid I": solveUniquePathsInAGridI,
  "Unique Paths in a Grid II": solveUniquePathsInAGridII,
  "Shortest Path in a Grid": solveShortestPathInAGrid,
  "Sanitize Parentheses in Expression": solveSanitizeParenthesesInExpression,
  "Find All Valid Math Expressions": solveFindAllValidMathExpressions,
  "HammingCodes: Integer to Encoded Binary":
    solveHammingCodesIntegerToEncodedBinary,
  "HammingCodes: Encoded Binary to Integer":
    solveHammingCodesEncodedBinaryToInteger,
  "Proper 2-Coloring of a Graph": solveProper2ColoringOfAGraph,
  "Compression I: RLE Compression": solveCompressionIRLECompression,
  "Compression II: LZ Decompression": solveCompressionIILZDecompression,
  "Compression III: LZ Compression": solveCompressionIIILZCompression,
  "Encryption I: Caesar Cipher": solveCaesarCipher,
  "Encryption II: Vigenère Cipher": solveVigenereCipher,
  "Square Root": solveSquareRoot,
};

export const solveContract = (
  contract: CodingContractObject,
): string | false => {
  const solver = solvers[contract.type];
  if (!solver) return false;

  const result = (solver as ContractSolver<any>)(contract.data);
  return contract.submit(result);
};
