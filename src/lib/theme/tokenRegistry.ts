export type ThemeName = 'rockbusters' | 'snowbusters'

export type ThemeTokenGroup =
  | 'brand'
  | 'alpha'
  | 'typography'
  | 'layout'
  | 'shape'
  | 'elevation'
  | 'overlay'
  | 'motion'
  | 'legacy-type'
  | 'header'
  | 'compatibility'
  | 'breakpoints'

export type ThemeTokenKind = 'color' | 'font' | 'size' | 'space' | 'shadow' | 'motion' | 'raw'

export type ThemeToken = {
  name: string
  label: string
  group: ThemeTokenGroup
  kind: ThemeTokenKind
  compatibilityOnly?: boolean
}

export const themeTokenGroups: Array<{ id: ThemeTokenGroup; label: string; description: string }> =
  [
    { id: 'brand', label: 'Brand Colors', description: 'Core semantic color contract.' },
    {
      id: 'alpha',
      label: 'Alpha Colors',
      description: 'Transparent color scales and faint borders.',
    },
    { id: 'typography', label: 'Typography', description: 'Fonts and semantic text sizes.' },
    { id: 'layout', label: 'Layout', description: 'Spacing, content widths, and section rhythm.' },
    { id: 'shape', label: 'Shape', description: 'Reusable border radius tokens.' },
    { id: 'elevation', label: 'Elevation', description: 'Card, panel, chip, and text shadows.' },
    {
      id: 'overlay',
      label: 'Overlays',
      description: 'Dark overlay scale used by media and heroes.',
    },
    { id: 'motion', label: 'Motion', description: 'Shared transition durations.' },
    {
      id: 'legacy-type',
      label: 'Legacy Type',
      description: 'Compatibility heading and body scale aliases.',
    },
    { id: 'header', label: 'Header', description: 'Header-specific dimensions and backgrounds.' },
    {
      id: 'compatibility',
      label: 'Compatibility Aliases',
      description: 'Migration aliases for older CSS modules.',
    },
    { id: 'breakpoints', label: 'Breakpoints', description: 'Legacy breakpoint aliases.' },
  ]

const colorTokens = [
  '--theme-color-ink',
  '--theme-color-canvas',
  '--theme-color-surface-1',
  '--theme-color-surface-2',
  '--theme-color-surface-3',
  '--theme-color-paper',
  '--theme-color-white-paper',
  '--theme-color-white-paper-soft',
  '--theme-color-white-paper-muted',
  '--theme-color-white-paper-border',
  '--theme-color-white-paper-divider',
  '--theme-color-breadcrumb-bg',
  '--theme-color-breadcrumb-border',
  '--theme-color-text',
  '--theme-color-text-muted',
  '--theme-color-text-soft',
  '--theme-color-page-bg',
  '--theme-color-page-text',
  '--theme-color-primary',
  '--theme-color-primary-hover',
  '--theme-color-accent',
  '--theme-color-detail-canvas',
  '--theme-color-detail-surface',
  '--theme-color-detail-action',
  '--theme-color-detail-action-hover',
  '--theme-color-detail-muted',
  '--theme-color-detail-text',
  '--theme-color-detail-text-muted',
  '--theme-color-success',
  '--theme-color-warning',
  '--theme-color-danger',
  '--theme-color-info',
  '--theme-color-border',
  '--theme-color-focus',
] as const

const alphaTokens = [
  '--theme-color-primary-soft',
  '--theme-color-primary-border',
  '--theme-color-paper-80',
  '--theme-color-paper-60',
  '--theme-color-paper-52',
  '--theme-color-paper-45',
  '--theme-color-paper-30',
  '--theme-color-paper-12',
  '--theme-color-paper-08',
  '--theme-color-ink-border-faint',
  '--theme-color-ink-border-subtle',
  '--theme-color-primary-strong-border',
] as const

const typographyTokens = [
  '--theme-font-display',
  '--theme-font-heading',
  '--theme-font-body',
  '--theme-font-technical',
  '--theme-text-xs',
  '--theme-text-sm',
  '--theme-text-base',
  '--theme-text-lg',
  '--theme-text-xl',
  '--theme-text-2xl',
  '--theme-text-3xl',
  '--theme-text-hero',
  '--theme-text-section',
  '--theme-text-card-lg',
  '--theme-text-card',
  '--theme-text-subheading',
  '--theme-text-lead',
  '--theme-text-body',
  '--theme-text-small',
  '--theme-text-label',
  '--theme-text-nav',
  '--theme-line-hero',
  '--theme-line-section',
  '--theme-line-card-lg',
  '--theme-line-card',
  '--theme-line-subheading',
  '--theme-line-lead',
  '--theme-line-body',
  '--theme-line-small',
  '--theme-line-label',
  '--theme-line-nav',
  '--theme-weight-hero',
  '--theme-weight-section',
  '--theme-weight-card-lg',
  '--theme-weight-card',
  '--theme-weight-subheading',
  '--theme-weight-label',
  '--theme-weight-nav',
] as const

const layoutTokens = [
  '--theme-rem-base',
  '--theme-space-1',
  '--theme-space-2',
  '--theme-space-3',
  '--theme-space-4',
  '--theme-space-5',
  '--theme-space-6',
  '--theme-space-7',
  '--theme-space-8',
  '--theme-space-9',
  '--theme-content',
  '--theme-copy',
  '--theme-content-padding',
  '--theme-content-max',
  '--theme-content-text-max',
  '--theme-gap',
  '--theme-section-pad',
  '--theme-card-pad',
  '--theme-section-gap-lg',
  '--theme-section-gap-md',
  '--theme-section-gap-sm',
] as const

const shapeTokens = ['--theme-radius-sm', '--theme-radius-md', '--theme-radius-lg'] as const

const elevationTokens = [
  '--theme-shadow-card',
  '--theme-shadow-auth-card',
  '--theme-shadow-card-hover',
  '--theme-shadow-chip',
  '--theme-shadow-panel',
  '--theme-shadow-text-strong',
] as const

const overlayTokens = [
  '--theme-overlay-dark-faint',
  '--theme-overlay-dark-soft',
  '--theme-overlay-dark-medium',
  '--theme-overlay-dark-strong',
  '--theme-overlay-dark-heavy',
] as const

const motionTokens = ['--theme-motion-fast', '--theme-motion-base'] as const

const legacyTypeTokens = [
  '--fs-eyebrow',
  '--fs-body-sm',
  '--fs-body',
  '--fs-body-lg',
  '--fs-card-title',
  '--rem-base',
  '--h1FontSize',
  '--h1LineHeight',
  '--h1MarginBottom',
  '--h1PaddingTop',
  '--h1PaddingBottom',
  '--h2FontSize',
  '--h2LineHeight',
  '--h2MarginBottom',
  '--h2PaddingTop',
  '--h2PaddingBottom',
  '--h3FontSize',
  '--h3LineHeight',
  '--h3MarginBottom',
  '--h3PaddingTop',
  '--h3PaddingBottom',
  '--h4FontSize',
  '--h4LineHeight',
  '--h4MarginBottom',
  '--h5FontSize',
  '--h5LineHeight',
  '--h5MarginBottom',
  '--eyebrowFontSize',
  '--eyebrowLineHeight',
  '--eyebrowMarginBottom',
  '--eyebrowLetterSpacing',
  '--pFontSize',
  '--textLineHeight',
  '--smallTextFontSize',
  '--smallTextLineHeight',
] as const

const headerTokens = [
  '--headerContactsHeight',
  '--headerHeight',
  '--headerTotalHeight',
  '--headerDividerWidth',
  '--headerDividerMaxWidth',
  '--headerDividerHeight',
  '--headerBg',
  '--headerBgScrolled',
] as const

const compatibilityTokens = [
  '--rb-red',
  '--rb-red-hover',
  '--rb-red-dim',
  '--rb-red-border',
  '--rb-black',
  '--rb-dark',
  '--rb-darker',
  '--rb-white',
  '--rb-white-80',
  '--rb-white-60',
  '--rb-white-52',
  '--rb-white-45',
  '--rb-white-30',
  '--rb-white-12',
  '--rb-white-08',
  '--rb-section-pad',
  '--rb-card-pad',
  '--colInfo',
  '--colOk',
  '--colWarning',
  '--colError',
  '--contentPadding',
  '--contentMaxWidth',
  '--contentTextMaxWidth',
  '--gap',
  '--sectionGapLg',
  '--sectionGapMd',
  '--sectionGapSm',
  '--transitionTimeBase',
] as const

const breakpointTokens = [
  '--breakpointSmall',
  '--breakpointMid',
  '--breakpointLarge',
  '--breakpointExtraLarge',
] as const

function labelFromToken(name: string) {
  return name.replace(/^--/, '').replace(/-/g, ' ')
}

function toTokens(
  names: readonly string[],
  group: ThemeTokenGroup,
  kind: ThemeTokenKind,
  compatibilityOnly = false,
): ThemeToken[] {
  return names.map((name) => ({
    name,
    label: labelFromToken(name),
    group,
    kind,
    compatibilityOnly,
  }))
}

export const themeTokens = [
  ...toTokens(colorTokens, 'brand', 'color'),
  ...toTokens(alphaTokens, 'alpha', 'color'),
  ...toTokens(typographyTokens.slice(0, 4), 'typography', 'font'),
  ...toTokens(typographyTokens.slice(4), 'typography', 'size'),
  ...toTokens(layoutTokens, 'layout', 'space'),
  ...toTokens(shapeTokens, 'shape', 'space'),
  ...toTokens(elevationTokens, 'elevation', 'shadow'),
  ...toTokens(overlayTokens, 'overlay', 'color'),
  ...toTokens(motionTokens, 'motion', 'motion'),
  ...toTokens(legacyTypeTokens, 'legacy-type', 'size', true),
  ...toTokens(headerTokens.slice(0, 6), 'header', 'space', true),
  ...toTokens(headerTokens.slice(6), 'header', 'color', true),
  ...toTokens(compatibilityTokens, 'compatibility', 'raw', true),
  ...toTokens(breakpointTokens, 'breakpoints', 'space', true),
] as const satisfies ThemeToken[]

export type ThemeTokenName = (typeof themeTokens)[number]['name']
