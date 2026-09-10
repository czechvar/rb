// Relative fit calculations may subtract local spacing. Numeric caps must
// come from the theme, even when nested inside min/max/clamp or a var fallback.
export function hasHardcodedWidthCap(property, value) {
  if (!['max-width', 'max-inline-size', 'width', 'inline-size'].includes(property)) return false
  if (!property.startsWith('max-') && !/\b(?:min|max|clamp)\(/i.test(value)) return false

  const withoutFitCalculations = value.replace(
    /calc\(\s*100%\s*[-+]\s*\d+(?:\.\d+)?(?:px|rem|em)\s*\)/gi,
    '',
  )
  return /(?<![\w-])\d*\.?\d+(?:px|rem|em|ch|ex|vw|vh|vmin|vmax|vi|vb|cm|mm|in|pt|pc)\b/i.test(withoutFitCalculations)
}
