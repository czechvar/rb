/** Build a complete editorial patch without passing null to Payload group traversal. */
type ObjectValue = Record<string, unknown>
const object = (value: unknown): value is ObjectValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const lexical = (value: unknown): value is ObjectValue =>
  object(value) && object(value.root) && value.root.type === 'root'

export function replacement(current: unknown, desired: unknown): unknown {
  // Rich text is an atomic document, not a CMS field group; null clears it.
  if (lexical(desired)) return structuredClone(desired)
  if (desired === null || desired === undefined) {
    if (Array.isArray(current)) return []
    if (!object(current) || lexical(current)) return null
    desired = {}
  }
  // Authored array rows replace the array, including their IDs during rollback.
  if (Array.isArray(desired)) return structuredClone(desired)
  if (!object(desired)) return desired
  const prior: ObjectValue = object(current) && !lexical(current) ? current : {}
  const result: ObjectValue = {}
  for (const key of new Set([...Object.keys(prior), ...Object.keys(desired)])) {
    if (key === 'id') continue
    result[key] = replacement(prior[key], Object.hasOwn(desired, key) ? desired[key] : undefined)
  }
  return result
}
