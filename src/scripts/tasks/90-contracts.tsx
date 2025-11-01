import { solveContract } from "@lib/contracts/solvers";
import { ServerRepository } from "@lib/servers/repository";
import type { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  using repo = await ServerRepository.open();
  for (const server of await repo.getAll()) {
    if (server.purchased) {
      continue;
    }

    const files = ns.ls(server.hostname, ".cct");
    for (const file of files) {
      const contract = ns.codingcontract.getContract(file, server.hostname);
      const result = solveContract(contract);
      if (result) {
        ns.print(`Contract at ${file} on ${server.hostname} solved: ${result}`);
      }
    }
  }
}
