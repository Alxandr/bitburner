import type { NS } from "@ns";

export function* crawlServers(ns: NS): Generator<string> {
  yield "home";

  const queue = ["home"];
  const seen = new Set<string>(queue);

  while (queue.length > 0) {
    const current = queue.shift()!;

    const neighbors = ns.scan(current);
    for (const n of neighbors) {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
        yield n;
      }
    }
  }
}
