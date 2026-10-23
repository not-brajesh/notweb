
/**
 * NOTWEB API Contracts
 *
 * Shared request, response, pagination, and API error contracts.
 * These types define data formats; they do not implement API endpoints.
 */

import type { AppError, Result } from "./index.js";

// -----------------------------------------------------------------------------
// API metadata
// -----------------------------------------------------------------------------

export interface ApiMeta {
  requestId?: string;
  timestamp: string;
  version?: string;
}

// -----------------------------------------------------------------------------
// Standard API responses
// -----------------------------------------------------------------------------

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: AppError;
  meta?: ApiMeta;
}

export type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

// -----------------------------------------------------------------------------
// Pagination
// -----------------------------------------------------------------------------

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Creates normalized pagination metadata.
 */
export function createPaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  if (!Number.isSafeInteger(totalItems) || totalItems < 0) {
    throw new RangeError("totalItems must be a non-negative safe integer.");
  }

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new RangeError("page must be a positive safe integer.");
  }

  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be a positive safe integer.");
  }

  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

/**
 * Creates a paginated response.
 */
export function createPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  if (items.length > pageSize) {
    throw new RangeError("The number of items cannot exceed pageSize.");
  }

  return {
    items,
    pagination: createPaginationMeta(totalItems, page, pageSize),
  };
}

// -----------------------------------------------------------------------------
// API response helpers
// -----------------------------------------------------------------------------

/**
 * Creates a successful API response.
 */
export function createApiSuccess<T>(
  data: T,
  meta?: ApiMeta,
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta === undefined ? {} : { meta }),
  };
}

/**
 * Creates a failed API response.
 */
export function createApiError(
  error: AppError,
  meta?: ApiMeta,
): ApiErrorResponse {
  return {
    success: false,
    error,
    ...(meta === undefined ? {} : { meta }),
  };
}

/**
 * Converts a Result into the standard API response format.
 */
export function resultToApiResponse<T>(
  result: Result<T, AppError>,
  meta?: ApiMeta,
): ApiResponse<T> {
  if (result.success) {
    return createApiSuccess(result.data, meta);
  }

  return createApiError(result.error, meta);
}

/**
 * Creates API metadata with a UTC timestamp.
 */
export function createApiMeta(options: {
  requestId?: string;
  version?: string;
} = {}): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    ...(options.requestId === undefined
      ? {}
      : { requestId: options.requestId }),
    ...(options.version === undefined
      ? {}
      : { version: options.version }),
  };
}
