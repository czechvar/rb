/** Seed IDs belong to the portable snapshot, not whichever local DB is exporting. */
export function mergeCategorySeedRows<T extends { id: number; slug: string }>(seedRows: T[], sourceRows: T[]): T[] {
  const merged = seedRows.map((row) => ({ ...row }))
  let nextId = Math.max(0, ...seedRows.map((row) => row.id)) + 1
  for (const source of sourceRows) {
    const index = merged.findIndex((row) => row.slug === source.slug)
    if (index >= 0) merged[index] = { ...source, id: merged[index].id }
    else merged.push({ ...source, id: nextId++ })
  }
  return merged.sort((left, right) => left.id - right.id)
}
