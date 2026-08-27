export function relationId<T extends { id: number }>(
  value: number | T | null | undefined,
): number | null {
  if (!value) return null
  return typeof value === 'object' ? value.id : value
}

export function relationIds<T extends { id: number }>(
  values: Array<number | T> | null | undefined,
): number[] {
  return (values ?? [])
    .map((value) => relationId(value))
    .filter((value): value is number => typeof value === 'number')
}
