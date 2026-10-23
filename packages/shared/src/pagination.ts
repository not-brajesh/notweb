
/**
 * NOTWEB Pagination Utilities
 *
 * Shared pagination types and helpers for lists and API results.
 */

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginationResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NormalizedPaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Default pagination settings.
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Validates and normalizes pagination options.
 */
export function normalizePaginationOptions(
  options: PaginationOptions = {},
): NormalizedPaginationOptions {
  const page = options.page ?? DEFAULT_PAGE;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new RangeError("Page must be a positive safe integer.");
  }

  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Page size must be a positive safe integer.");
  }

  if (pageSize > MAX_PAGE_SIZE) {
    throw new RangeError(
      `Page size cannot exceed ${MAX_PAGE_SIZE}.`,
    );
  }

  return { page, pageSize };
}

/**
 * Calculates the zero-based offset for a paginated query.
 */
export function getPaginationOffset(
  options: PaginationOptions = {},
): number {
  const { page, pageSize } = normalizePaginationOptions(options);
  const offset = (page - 1) * pageSize;

  if (!Number.isSafeInteger(offset)) {
    throw new RangeError("Pagination offset exceeds the safe integer range.");
  }

  return offset;
}

/**
 * Creates pagination metadata for an existing collection.
 */
export function createPaginationResult<T>(
  items: T[],
  totalItems: number,
  options: PaginationOptions = {},
): PaginationResult<T> {
  const { page, pageSize } = normalizePaginationOptions(options);

  if (!Number.isSafeInteger(totalItems) || totalItems < 0) {
    throw new RangeError(
      "Total items must be a non-negative safe integer.",
    );
  }

  if (items.length > pageSize) {
    throw new RangeError(
      "The number of returned items cannot exceed the page size.",
    );
  }

  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

/**
 * Paginates an in-memory array.
 *
 * For large datasets, prefer database-level pagination.
 */
export function paginateArray<T>(
  items: readonly T[],
  options: PaginationOptions = {},
): PaginationResult<T> {
  const normalized = normalizePaginationOptions(options);
  const offset = getPaginationOffset(normalized);
  const pageItems = items.slice(
    offset,
    offset + normalized.pageSize,
  );

  return createPaginationResult(
    pageItems,
    items.length,
    normalized,
  );
}

/**
 * Calculates the total number of pages.
 */
export function getTotalPages(
  totalItems: number,
  pageSize: number,
): number {
  if (!Number.isSafeInteger(totalItems) || totalItems < 0) {
    throw new RangeError(
      "Total items must be a non-negative safe integer.",
    );
  }

  if (
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE
  ) {
    throw new RangeError(
      `Page size must be between 1 and ${MAX_PAGE_SIZE}.`,
    );
  }

  return Math.ceil(totalItems / pageSize);
}
