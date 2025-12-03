import { Filter } from 'mongodb'

/**
 * Result of building query
 */
export type MongoQuery<T = any> = Filter<T>

/**
 * Parameters for building date range query
 */
export interface DateRangeFilter {
  from?: string | Date
  to?: string | Date
}
