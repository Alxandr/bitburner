import type { NS } from "@ns";

export const disableLog = (ns: NS, ...logs: string[]): Disposable => {
  ns.disableLog("disableLog");
  ns.disableLog("enableLog");
  ns.disableLog("isLogEnabled");

  const enabledLogs = logs.filter((log) => ns.isLogEnabled(log));
  for (const log of enabledLogs) {
    ns.disableLog(log);
  }

  return {
    [Symbol.dispose]() {
      try {
        for (const log of enabledLogs) {
          ns.enableLog(log);
        }
      } catch (error) {
        // ignore error
      }
    },
  };
};
