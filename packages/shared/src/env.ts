
/**
 * NOTWEB Environment Utilities
 *
 * Provides safe helpers for reading environment variables.
 * Never place secrets or private credentials in frontend environment variables.
 */

export type EnvironmentName = "development" | "test" | "production";

export interface EnvironmentOptions {
  allowEmpty?: boolean;
}

export class EnvironmentError extends Error {
  public readonly variableName: string;

  constructor(variableName: string, message: string) {
    super(message);
    this.name = "EnvironmentError";
    this.variableName = variableName;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Reads an environment variable without assuming a particular runtime.
 *
 * Supply the environment object explicitly when using this function
 * in Node.js or another runtime.
 */
export function readEnvironmentVariable(
  name: string,
  environment: Record<string, string | undefined>,
  options: EnvironmentOptions = {},
): string | undefined {
  const value = environment[name];

  if (value === undefined) {
    return undefined;
  }

  if (!options.allowEmpty && value.trim().length === 0) {
    return undefined;
  }

  return value;
}

/**
 * Reads a required environment variable.
 */
export function requireEnvironmentVariable(
  name: string,
  environment: Record<string, string | undefined>,
): string {
  const value = readEnvironmentVariable(name, environment);

  if (value === undefined) {
    throw new EnvironmentError(
      name,
      `Required environment variable "${name}" is missing or empty.`,
    );
  }

  return value;
}

/**
 * Parses a boolean environment variable.
 *
 * Accepted true values: true, 1, yes, on
 * Accepted false values: false, 0, no, off
 */
export function parseEnvironmentBoolean(
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  switch (value.trim().toLowerCase()) {
    case "true":
    case "1":
    case "yes":
    case "on":
      return true;

    case "false":
    case "0":
    case "no":
    case "off":
      return false;

    default:
      throw new TypeError(
        `Invalid boolean environment value: "${value}".`,
      );
  }
}

/**
 * Parses a positive integer environment variable.
 */
export function parseEnvironmentInteger(
  value: string | undefined,
  defaultValue: number,
): number {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  if (!/^\d+$/.test(value.trim())) {
    throw new TypeError(
      `Invalid integer environment value: "${value}".`,
    );
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new RangeError(
      "Environment integer must be a positive safe integer.",
    );
  }

  return parsed;
}

/**
 * Parses the application's environment name.
 */
export function parseEnvironmentName(
  value: string | undefined,
): EnvironmentName {
  switch (value?.trim().toLowerCase()) {
    case "development":
      return "development";

    case "test":
      return "test";

    case "production":
      return "production";

    default:
      throw new TypeError(
        `Invalid application environment: "${value ?? ""}".`,
      );
  }
}

/**
 * Checks whether the application is running in production.
 */
export function isProductionEnvironment(
  value: EnvironmentName,
): boolean {
  return value === "production";
}

/**
 * Checks whether the application is running in development.
 */
export function isDevelopmentEnvironment(
  value: EnvironmentName,
): boolean {
  return value === "development";
}
