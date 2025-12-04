export function isWildcardError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('Wildcard')
}
