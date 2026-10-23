import type { JobId, ProjectId, UserId } from "./index.js";

/**
 * Generates a unique identifier using the Web Crypto API.
 *
 * Supported environments must provide crypto.randomUUID().
 */
function generateId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Generates a unique project ID.
 */
export function createProjectId(): ProjectId {
  return generateId() as ProjectId;
}

/**
 * Generates a unique background job ID.
 */
export function createJobId(): JobId {
  return generateId() as JobId;
}

/**
 * Generates a unique user ID.
 */
export function createUserId(): UserId {
  return generateId() as UserId;
}

/**
 * Checks whether a value has the standard UUID format.
 *
 * This checks format only; it does not verify ownership or existence.
 */
export function isValidUuid(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidPattern.test(value);
}
