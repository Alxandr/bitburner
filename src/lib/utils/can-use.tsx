import type { NS } from "@ns";

export const canUseFormulas = (ns: NS) => ns.fileExists("Formulas.exe", "home");
