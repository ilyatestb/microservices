/**
 * Parameters for pagination
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Result of pagination calculations (for MongoDB)
 */
export interface PaginationQuery {
  skip: number
  limit: number
  page: number
}

/**
 * Pagination metadata for response to client
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Wrapper for paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}
