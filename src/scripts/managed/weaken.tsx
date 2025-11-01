import { args, positionals } from "@lib/args";
import * as types from "@lib/utils/type-token/types";
import type { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const {
    delay,
    threads,
    [positionals]: [target],
  } = args(
    ns,
    {
      delay: {
        description: "Amount of time to delay by",
        type: types.positiveInteger,
        default: () => types.positiveInteger.cast(0),
        long: "delay",
        short: "s",
      },
      threads: {
        description: "Number of threads to use",
        type: types.positiveNumber.or(types.null),
        default: () => null,
        long: "threads",
      },
    },
    [
      {
        description: "The target server",
        type: types.string,
        required: true,
      },
    ],
  );

  await ns.hack(target, {
    additionalMsec: delay,
    threads: threads === null ? void 0 : threads,
  });
}
