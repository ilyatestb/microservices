import { PaginatedResponse, PaginationMeta, PaginationParams } from '../types/pagination.types'

/**
 * Default values for pagination
 */
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 25

/**
 * Builds pagination metadata for response
 */
export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  const { page, limit } = params
  const totalPages = Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Formats a full paginated response with data and metadata
 */
export function formatPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  return {
    data,
    meta: buildPaginationMeta(total, params),
  }
}

/**
 * Prepares pagination for use in MongoDB query
 */
export function preparePagination(page?: number, limit?: number) {
  const pageParam = page || DEFAULT_PAGE
  const limitParam = limit || DEFAULT_LIMIT

  return {
    params: { page: pageParam, limit: limitParam },
    query: {
      skip: (pageParam - 1) * limitParam,
      limit: limitParam,
      page: pageParam,
    },
  }
}
