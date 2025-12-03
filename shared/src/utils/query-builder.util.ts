import { MongoQuery } from '../types/query-builder.types'
/**
 * Escapes special characters regex for safe search
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.+?[\](){}^$|\\]/g, '\\$&')
}

/**
 * Validates search query (checks wildcard at the beginning)
 */
export function validateSearchQuery(searchText: string): void {
  if (searchText.startsWith('*')) {
    throw new Error('Wildcard (*) cannot be the first character in search query')
  }
}

/**
 * Sanitize search query (escape + handle wildcard)
 */
export function sanitizeSearchText(searchText: string): string {
  const escaped = escapeRegex(searchText)
  return escaped.replace(/\*/g, '.*')
}

/**
 * Builds query for searching logs with filtering by type and date range
 */
export function buildLogsQuery(filters: { type?: string; from?: string; to?: string }): MongoQuery {
  const query: MongoQuery = {}

  if (filters.type !== undefined && filters.type !== null && filters.type !== '') {
    ;(query as Record<string, unknown>).type = filters.type
  }

  if (filters.from || filters.to) {
    const dateFilter: Record<string, Date> = {}

    if (filters.from) {
      dateFilter.$gte = new Date(filters.from)
    }

    if (filters.to) {
      dateFilter.$lte = new Date(filters.to)
    }

    ;(query as Record<string, unknown>).timestamp = dateFilter
  }

  return query
}

/**
 * Builds query for data search
 */
export async function buildDynamicSearchQuery<T>(
  collection: { findOne: (filter: any) => Promise<T | null> },
  searchText: string,
): Promise<MongoQuery> {
  validateSearchQuery(searchText)
  const sanitizedQuery = sanitizeSearchText(searchText)

  const sample = await collection.findOne({})
  if (!sample) {
    return {}
  }

  const keys = Object.keys(sample).filter((key) => typeof sample[key] === 'string' || typeof sample[key] === 'number')

  if (keys.length === 0) {
    return {}
  }

  return {
    $or: keys.map((key) => ({
      [key]: { $regex: sanitizedQuery, $options: 'i' },
    })),
  }
}
