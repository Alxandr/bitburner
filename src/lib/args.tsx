import type { NS } from "@ns";
import type { TypeToken } from "./utils/type-token";
import { toArray } from "./utils/to-array";

export const errors = Symbol("args:errors");
export const usage = Symbol("args:usage");
export const positionals = Symbol("args:positionals");

const EMPTY_SET: Readonly<Set<string>> = Object.freeze(new Set<string>());

type char = string;

type PositionalArgDef<T> = {
  readonly description: string;
  readonly type: TypeToken<T>;
} & (
  | { readonly required: true }
  | { readonly default: () => NoInfer<T>; readonly required?: false }
);

type LongOptionDef = { readonly long: readonly string[] | string };
type ShortOptionDef = { readonly short: readonly char[] | char };
type OptionNameConfig =
  | LongOptionDef
  | ShortOptionDef
  | (LongOptionDef & ShortOptionDef);

type FlagOptionDef = {
  readonly description: string;
  readonly type: "flag";
};

type OptionDef<T> = (FlagOptionDef | PositionalArgDef<T>) & OptionNameConfig;

type ArgType<T extends PositionalArgDef<any>> =
  T extends PositionalArgDef<infer K> ? K : never;

type OptType<T extends OptionDef<any>> = T extends FlagOptionDef
  ? boolean
  : T extends PositionalArgDef<infer K>
    ? K
    : never;

type ParseErrorResult = {
  readonly [errors]: readonly string[];
  readonly [usage]?: string;
};

type ParseSuccessArgs<Args extends readonly PositionalArgDef<any>[]> = {
  readonly [K in keyof Args]: ArgType<Args[K]>;
};

type ParseSuccessOptions<
  Opts extends Readonly<Record<string, OptionDef<any>>>,
> = {
  readonly [K in keyof Opts]: OptType<Opts[K]>;
};

type ParseSuccessResult<
  Opts extends Readonly<Record<string, OptionDef<any>>>,
  Args extends readonly PositionalArgDef<any>[],
> = ParseSuccessOptions<Opts> & {
  readonly [positionals]: ParseSuccessArgs<Args>;
};

type ParseResult<
  Opts extends Readonly<Record<string, OptionDef<any>>>,
  Args extends readonly PositionalArgDef<any>[],
> = ParseSuccessResult<Opts, Args> | ParseErrorResult;

export const tryArgs = <
  const Opts extends Readonly<Record<string, OptionDef<any>>>,
  const Args extends readonly PositionalArgDef<any>[],
>(
  ns: NS,
  opts: Opts,
  args: Args,
): ParseResult<Opts, Args> => {
  const ret = {
    [positionals]: [],
  } as any;

  const optDefs = Object.entries(opts).map(([key, def]) => {
    const long = "long" in def ? new Set(toArray(def.long)) : EMPTY_SET;
    const short = "short" in def ? new Set(toArray(def.short)) : EMPTY_SET;
    let display: string;

    if ("long" in def) {
      if (Array.isArray(def.long)) {
        display = `--${def.long[0]}`;
      } else {
        display = `--${def.long}`;
      }
    } else {
      if (Array.isArray(def.short)) {
        display = `-${def.short[0]}`;
      } else {
        display = `-${def.short}`;
      }
    }

    return {
      ...def,
      key: key as keyof Opts,
      short,
      long,
      display,
    };
  });
  const remainingPositionals = [...args];

  const optKeys = Object.keys(opts) as readonly (keyof Opts)[];
  for (const optKey of optKeys) {
    const conf: OptionDef<any> = opts[optKey]!;
    if ("default" in conf) {
      ret[optKey] = (0, conf.default)();
    }
  }

  const progArgs = ns.args;
  const parseErrors: string[] = [];

  outer: for (let i = 0; i < progArgs.length; i++) {
    const arg = progArgs[i]!;
    // ns.tprint(`arg: ${arg}`);

    if (typeof arg === "string" && arg.startsWith("--")) {
      const longOption = arg.slice(2).split("=", 1)[0]!;
      let neg = false;

      const indexOfEquals = arg.indexOf("=");
      const hasValue = indexOfEquals !== -1;

      const optionValueAfterEquals = hasValue
        ? void 0
        : arg.slice(indexOfEquals + 1);

      let optDef = optDefs.find((def) => def.long.has(longOption));
      if (!optDef) {
        if (longOption.startsWith("--no")) {
          const noNegLongOption = longOption.slice(3);
          optDef = optDefs.find((def) => def.long.has(noNegLongOption));
          neg = true;
        }
      }

      if (!optDef) {
        parseErrors.push(`Unrecognized option: --${longOption}`);
        continue;
      }

      if (optDef.type === "flag") {
        let flagValue = neg;
        if (hasValue) {
          if (optionValueAfterEquals === "true") {
            flagValue = !neg;
          } else if (optionValueAfterEquals === "false") {
            flagValue = neg;
          } else {
            parseErrors.push(`Invalid flag value for option: --${longOption}`);
            continue;
          }
        }

        ret[optDef.key] = flagValue;
        continue;
      }

      if (!hasValue) i++;
      const optValue = hasValue ? optionValueAfterEquals : progArgs[i];
      if (typeof optValue === "undefined") {
        parseErrors.push(`Option specified without value: --${longOption}`);
        continue;
      }

      const parsedValue = optDef.type.tryParse(optValue);
      if (parsedValue instanceof TypeError) {
        parseErrors.push(
          `Invalid value for option --${longOption}: ${parsedValue.message}`,
        );
        continue;
      }

      ret[optDef.key] = parsedValue;
      continue;
    }

    if (typeof arg === "string" && arg.startsWith("-")) {
      const shortOptions = arg.slice(1);
      for (let charIndex = 0; charIndex < shortOptions.length; charIndex++) {
        const shortName = shortOptions.charAt(charIndex);
        const optDef = optDefs.find((def) => def.short.has(shortName));
        if (!optDef) {
          parseErrors.push(`Unrecognized option: -${shortName}`);
          continue outer;
        }

        if (optDef.type === "flag") {
          ret[optDef.key] = true;
          continue;
        }

        const hasValue = charIndex < shortOptions.length - 1;
        if (!hasValue) i++;

        const optValue = hasValue
          ? shortOptions.slice(charIndex + 1)
          : progArgs[i];
        if (hasValue) charIndex = shortOptions.length;

        if (typeof optValue === "undefined") {
          parseErrors.push(`Option specified without value: -${shortName}`);
          continue;
        }

        const parsedValue = optDef.type.tryParse(optValue);
        if (parsedValue instanceof TypeError) {
          parseErrors.push(
            `Invalid value for option -${shortName}: ${parsedValue.message}`,
          );
          continue;
        }

        ret[optDef.key] = parsedValue;
        continue;
      }

      continue;
    }

    const positionalDef = remainingPositionals.shift();
    if (!positionalDef) {
      parseErrors.push(`Unexpected positional argument: ${arg}`);
      continue;
    }

    const parsedPositional = positionalDef.type.tryParse(arg);
    if (parsedPositional instanceof TypeError) {
      parseErrors.push(
        `Invalid positional argument '${arg}': ${parsedPositional.message}`,
      );
      continue;
    }

    ret[positionals].push(parsedPositional);
  }

  // post-parse - check required values
  for (const def of optDefs) {
    if ("required" in def && def.required && def.key in ret) {
      parseErrors.push(`Missing required option: ${def.display}`);
    }
  }

  let missingPositionals = 0;
  while (remainingPositionals.length > 0) {
    const def = remainingPositionals.shift()!;
    if ("required" in def && def.required) {
      missingPositionals++;
    } else {
      ret[positionals].push((0, def.default)());
    }
  }

  if (missingPositionals > 0) {
    parseErrors.push(`Missing ${missingPositionals} positional arguments`);
  }

  if (parseErrors.length > 0) {
    return { [errors]: Object.freeze(parseErrors) };
  }

  return ret;
};

export const args = <
  const Opts extends Readonly<Record<string, OptionDef<any>>>,
  const Args extends readonly PositionalArgDef<any>[],
>(
  ns: NS,
  opts: Opts,
  args: Args,
): ParseSuccessResult<Opts, Args> => {
  const parsed = tryArgs(ns, opts, args);

  if (errors in parsed) {
    ns.tprint("Argument errors:");
    for (const error of parsed[errors]) {
      ns.tprint("- ", error);
    }

    if (parsed[usage]) {
      ns.tprint();
      ns.tprint(`Usage:`);
      ns.tprint(parsed[usage]);
    }

    ns.exit();
  }

  return parsed;
};
