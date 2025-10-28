import type { NS } from "@ns";

type Item = {
  readonly hostname: string;
  readonly path: readonly string[];
};

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0] as string;
  if (!target) {
    ns.tprint("Usage: find.js <target>");
    return;
  }

  const initial = ns.getServer();
  const queue: Item[] = [{ hostname: initial.hostname, path: [] }];
  const seen = new Set<string>(queue.map((i) => i.hostname));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const server = ns.getServer(current.hostname);

    const neighbors = ns.scan(current.hostname);
    for (const n of neighbors) {
      if (n === target) {
        ns.tprint(`Found target at ${current.path.join(" -> ")} -> ${n}`);
        return;
      }

      if (!seen.has(n)) {
        seen.add(n);
        queue.push({ hostname: n, path: [...current.path, n] });
      }
    }
  }
}
