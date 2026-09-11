/** Payload adds IDs/defaults; check every replacement field, including explicit clears. */
export function editorialMatches(actual: unknown, expected: unknown): boolean {
  if (expected == null) return empty(actual)
  if (Array.isArray(expected))
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((child, index) => editorialMatches(actual[index], child))
    )
  if (typeof expected === 'object')
    return (
      !!actual &&
      typeof actual === 'object' &&
      Object.entries(expected).every(([key, child]) =>
        editorialMatches((actual as Record<string, unknown>)[key], child),
      )
    )
  return actual === expected
}

function empty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0
  if (value && typeof value === 'object')
    return Object.entries(value).every(([key, child]) => key === 'id' || empty(child))
  return value == null || value === '' || value === false
}
