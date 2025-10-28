import type { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  while (true) {
    let startTime = Date.now();
    for (const script of ns.ls("home", "scripts/tasks/")) {
      const pid = ns.run(script);
      if (pid < 0) {
        ns.toast(`Failed to run ${script}`, "error");
      }

      while (ns.isRunning(pid)) {
        await ns.sleep(500);
      }
    }

    let duration = Date.now() - startTime;
    if (duration < 60_000) {
      // Sleep for the remaining time to reach 60 seconds
      await ns.sleep(60_000 - duration);
    }
  }
}
