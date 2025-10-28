import pino from "pino";
import pretty from "pino-pretty";

const stream = process.stdout.isTTY ? pretty({ colorize: true }) : void 0;

const logger = pino({ level: "info" }, stream);

export const createLogger = (module: string) => logger.child({ module });
