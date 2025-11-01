import type { ScriptArg } from "@ns";
import type { Branded } from "./branded";

class TypeValidationContext {
  static forToken<T>(token: TypeToken<T>, coerce: boolean = false) {
    return new TypeValidationContext(token.name, coerce);
  }

  readonly #coerce: boolean;
  readonly #typeName: string;

  private constructor(typeName: string, coerce: boolean) {
    this.#typeName = typeName;
    this.#coerce = coerce;
  }

  get coerce() {
    return this.#coerce;
  }

  prop<T>(name: string, type: TypeToken<T>) {
    return TypeValidationContext.forToken(type, this.#coerce);
  }

  fork(name: string) {
    return new TypeValidationContext(name, this.#coerce);
  }

  toTypeError(): TypeError {
    return new TypeError(`Expected ${this.#typeName}`);
  }
}

type Validator<T> = (
  value: unknown,
  context: TypeValidationContext,
) => value is T;

export class TypeToken<T> {
  readonly #name: string;
  readonly #validate: (
    value: unknown,
    context: TypeValidationContext,
  ) => value is T;

  constructor(name: string, validate: Validator<T>) {
    this.#name = name;
    this.#validate = validate;
  }

  get name(): string {
    return this.#name;
  }

  get type(): T {
    throw new Error(`Only for type interference`);
  }

  validate(value: unknown, context: TypeValidationContext): value is T {
    return this.#validate(value, context);
  }

  check(value: unknown): value is T {
    return this.#validate(value, TypeValidationContext.forToken(this));
  }

  tryCast(value: unknown): T | TypeError {
    const context = TypeValidationContext.forToken(this);
    if (!this.#validate(value, TypeValidationContext.forToken(this))) {
      return context.toTypeError();
    }

    return value;
  }

  cast(value: unknown): T {
    const result = this.tryCast(value);
    if (result instanceof TypeError) {
      throw result;
    }

    return result;
  }

  tryParse(value: ScriptArg): T | TypeError {
    const context = TypeValidationContext.forToken(this, true);
    if (!this.#validate(value, TypeValidationContext.forToken(this))) {
      return context.toTypeError();
    }

    return value;
  }

  brand<B extends string>(brand: B): TypeToken<Branded<T, B>> {
    return new TypeToken(
      `${this.name}#${brand}`,
      this.#validate as Validator<Branded<T, B>>,
    );
  }

  narrow<B extends string>(
    brand: B,
    validator: (value: T, context: TypeValidationContext) => boolean,
  ): TypeToken<Branded<T, B>> {
    const baseValidate = this.#validate;
    const newValidator = ((value, context) =>
      baseValidate(value, context) &&
      validator(value, context)) as Validator<T>;

    return new TypeToken(
      `${this.name}#${brand}`,
      newValidator as Validator<Branded<T, B>>,
    );
  }

  or<U>(other: TypeToken<U>): TypeToken<T | U> {
    const left = this.#validate;
    const right = other.#validate;
    const leftName = this.name;
    const rightName = other.name;

    const newValidator = ((value, context) =>
      left(value, context.fork(leftName)) ||
      right(value, context.fork(rightName))) as Validator<T | U>;

    return new TypeToken(`${this.name} | ${other.name}`, newValidator);
  }
}

export type { TypeValidationContext, Validator };

export const typeToken = <T extends unknown>(
  name: string,
  validate: Validator<T>,
): TypeToken<T> => new TypeToken(name, validate);
