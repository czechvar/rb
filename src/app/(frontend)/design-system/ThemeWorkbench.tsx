'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { formatThemeOverrides } from '@/lib/theme/cssExport'
import { themePresets } from '@/lib/theme/themePresets'
import {
  themeTokenGroups,
  themeTokens,
  type ThemeName,
  type ThemeToken,
} from '@/lib/theme/tokenRegistry'

import styles from './page.module.css'

type ThemeWorkbenchProps = {
  children: ReactNode
  theme: ThemeName
  themeClass: string
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim())
}

function swatchValue(token: ThemeToken, value: string) {
  if (token.kind === 'color' && (isHexColor(value) || value.startsWith('rgb'))) {
    return value
  }

  return undefined
}

export function ThemeWorkbench({ children, theme, themeClass }: ThemeWorkbenchProps) {
  const previewRef = useRef<HTMLElement | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const defaults = themePresets[theme]

  useEffect(() => {
    const preview = previewRef.current

    if (!preview) {
      return
    }

    themeTokens.forEach((token) => {
      preview.style.removeProperty(token.name)
    })

    Object.entries(overrides).forEach(([name, value]) => {
      if (value.trim().length > 0) {
        preview.style.setProperty(name, value)
      }
    })
  }, [overrides])

  const changedCount = Object.keys(overrides).length
  const exportCss = useMemo(() => formatThemeOverrides(theme, overrides), [overrides, theme])

  const updateToken = (name: string, value: string) => {
    setCopied(false)
    setOverrides((current) => {
      const next = { ...current }
      const normalizedValue = value.trim()

      if (normalizedValue.length === 0 || value === defaults[name]) {
        delete next[name]
      } else {
        next[name] = value
      }

      return next
    })
  }

  const resetToken = (name: string) => {
    setCopied(false)
    setOverrides((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const resetTheme = () => {
    setCopied(false)
    setOverrides({})
  }

  const copyOverrides = async () => {
    if (!exportCss) {
      return
    }

    await navigator.clipboard.writeText(exportCss)
    setCopied(true)
  }

  return (
    <div className={styles.workbench}>
      <aside className={styles.editor} aria-label="Theme playground controls">
        <div className={styles.editorHeader}>
          <div>
            <p className={styles.editorEyebrow}>Playground</p>
            <h2>Theme Tokens</h2>
          </div>
          <strong>{changedCount}</strong>
        </div>

        <div className={styles.editorActions}>
          <button type="button" onClick={resetTheme} disabled={changedCount === 0}>
            Reset theme
          </button>
          <button type="button" onClick={copyOverrides} disabled={changedCount === 0}>
            {copied ? 'Copied' : 'Copy CSS'}
          </button>
        </div>

        <p className={styles.editorNote}>
          Base theme tokens are editable here. Responsive media-query overrides in theme.css are
          intentionally left as code-only values for this first playground.
        </p>

        {themeTokenGroups.map((group) => {
          const tokens = themeTokens.filter((token) => token.group === group.id)

          return (
            <section className={styles.tokenGroup} key={group.id}>
              <details open={!tokens[0]?.compatibilityOnly}>
                <summary>
                  <span>
                    {group.label}
                    {tokens.some((token) => token.compatibilityOnly) ? (
                      <em>Compatibility</em>
                    ) : null}
                  </span>
                  <small>{tokens.length}</small>
                </summary>
                <p>{group.description}</p>
                <div className={styles.tokenList}>
                  {tokens.map((token) => {
                    const value = overrides[token.name] ?? defaults[token.name] ?? ''
                    const colorValue = swatchValue(token, value)

                    return (
                      <label className={styles.tokenControl} key={token.name}>
                        <span className={styles.tokenMeta}>
                          <span>{token.label}</span>
                          <code>{token.name}</code>
                        </span>
                        <span className={styles.tokenInputs}>
                          {isHexColor(value) ? (
                            <input
                              aria-label={`${token.label} color`}
                              className={styles.colorInput}
                              type="color"
                              value={value}
                              onChange={(event) =>
                                updateToken(token.name, event.currentTarget.value)
                              }
                            />
                          ) : (
                            <span
                              className={styles.valueSwatch}
                              style={colorValue ? { background: colorValue } : undefined}
                              aria-hidden="true"
                            />
                          )}
                          <input
                            value={value}
                            onChange={(event) => updateToken(token.name, event.currentTarget.value)}
                            spellCheck={false}
                          />
                          <button
                            type="button"
                            onClick={() => resetToken(token.name)}
                            disabled={overrides[token.name] === undefined}
                          >
                            Reset
                          </button>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </details>
            </section>
          )
        })}

        <section className={styles.exportPanel}>
          <h3>Changed Overrides</h3>
          <textarea
            readOnly
            value={exportCss}
            placeholder="Edited tokens appear here as a CSS block."
          />
        </section>
      </aside>

      <main ref={previewRef} className={`${styles.shell} ${styles.preview} ${themeClass}`}>
        {children}
      </main>
    </div>
  )
}
