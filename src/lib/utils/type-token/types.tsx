import {
  typeToken,
  TypeToken,
  type TypeValidationContext,
  type Validator,
} from "../type-token";

const nullToken = typeToken("null", (value) => value === null);

const undefinedToken = typeToken("undefined", (value) => value === undefined);

const string = typeToken("string", (value) => typeof value === "string");

const number = typeToken("number", (value) => typeof value === "number");
const positiveNumber = number.narrow("positive", (value) => value >= 0);
const integer = number.narrow("integer", (value) =>
  Number.isSafeInteger(value),
);
const positiveInteger = integer.narrow("positive", (value) => value >= 0);

const boolean = typeToken("boolean", (value) => typeof value === "boolean");

const index = number.narrow(
  "index",
  (value) => Number.isSafeInteger(value) && value >= 0,
);

const object = typeToken("object", (value) => typeof value === "object");

const struct = <T extends Readonly<Record<string, TypeToken<any>>>>(
  name: string,
  structure: T,
): TypeToken<{ readonly [K in keyof T]: T[K]["type"] }> => {
  const entries = Object.entries(structure);
  const validator = (value: unknown, context: TypeValidationContext) => {
    if (typeof value !== "object" || value === null) return false;

    let hasErrors = false;
    for (const [key, type] of entries) {
      if (!Object.hasOwn(value, key)) {
        hasErrors = true;
        // TODO: add error to context
        continue;
      }

      hasErrors ||= !type.validate(
        (value as any)[key],
        context.prop(key, type),
      );
      // hasError ||= !type.validate()
    }

    return !hasErrors;
  };

  return new TypeToken(name, validator as Validator<any>);
};

export {
  nullToken as null,
  undefinedToken as undefined,
  string,
  number,
  positiveNumber,
  integer,
  positiveInteger,
  index,
  boolean,
  object,
  struct,
};
