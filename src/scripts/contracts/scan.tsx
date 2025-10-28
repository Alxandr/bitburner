import { ServerRepository } from "@lib/servers/repository";
import type { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  using repo = await ServerRepository.open();
  const types = new Map<string, number>();
  for (const server of await repo.getAll()) {
    if (server.purchased) {
      continue;
    }

    const files = ns.ls(server.hostname, ".cct");
    for (const file of files) {
      const contract = ns.codingcontract.getContract(file, server.hostname);
      const prev = types.get(contract.type) ?? 0;
      types.set(contract.type, prev + 1);
    }
  }

  ns.tprint(`Contract types:`);
  for (const [type, count] of types) {
    ns.tprint(`  ${type}: ${count}`);
  }
}
