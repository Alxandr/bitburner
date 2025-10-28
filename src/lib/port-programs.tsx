import type { NS, Server } from "@ns";

type PortProgram = {
  readonly port: string;
  readonly program: string;
  readonly available: (ns: NS) => boolean;
  readonly isOpen: (server: Server) => boolean;
  readonly open: (ns: NS, server: Server) => boolean;
};

const createPortProgram = (
  port: string,
  program: string,
  check: (server: Server) => boolean,
  open: (ns: NS, server: Server) => boolean,
): PortProgram =>
  Object.freeze({
    port,
    program,
    available: (ns: NS) => ns.fileExists(program, "home"),
    isOpen: check,
    open,
  });

export const portPrograms: readonly PortProgram[] = Object.freeze([
  createPortProgram(
    "ssh",
    "BruteSSH.exe",
    (s) => s.sshPortOpen,
    (ns, s) => ns.brutessh(s.hostname),
  ),
  createPortProgram(
    "ftp",
    "FTPCrack.exe",
    (s) => s.ftpPortOpen,
    (ns, s) => ns.ftpcrack(s.hostname),
  ),
  createPortProgram(
    "smtp",
    "relaySMTP.exe",
    (s) => s.smtpPortOpen,
    (ns, s) => ns.relaysmtp(s.hostname),
  ),
  createPortProgram(
    "http",
    "HTTPWorm.exe",
    (s) => s.httpPortOpen,
    (ns, s) => ns.httpworm(s.hostname),
  ),
  createPortProgram(
    "sql",
    "SQLInject.exe",
    (s) => s.sqlPortOpen,
    (ns, s) => ns.sqlinject(s.hostname),
  ),
]);
