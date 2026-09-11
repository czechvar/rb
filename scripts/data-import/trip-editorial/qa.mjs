/** Browser QA of the temporary development fixture route; public text only, no DB writes. */
import fs from 'node:fs/promises'
import { chromium } from '@playwright/test'
const base = new URL('./', import.meta.url)
const output = '.scratch/trip-editorial-rollout/qa'
const manifests = (
  await Promise.all(
    ['standalone', 'rockroad', 'espana'].map(async (name) =>
      JSON.parse(await fs.readFile(new URL(`manifests/${name}.json`, base), 'utf8')),
    ),
  )
).flat()
const requested = process.argv
  .find((arg) => arg.startsWith('--ids='))
  ?.slice(6)
  .split(',')
  .map(Number)
const widths = process.argv
  .find((arg) => arg.startsWith('--widths='))
  ?.slice(9)
  .split(',')
  .map(Number) ?? [1440, 390]
const origin =
  process.argv.find((arg) => arg.startsWith('--origin='))?.slice(9) ?? 'http://localhost:4444'
const mode = process.argv.includes('--public') ? 'public' : 'fixture'
const batch = manifests.filter((m) => !requested || requested.includes(m.target.eventDateId))
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
// Browsers insert line-break spaces around heading segments; compare whitespace independently.
const compact = (value) => normalize(value).replace(/\s/g, '')
await fs.mkdir(output, { recursive: true })
let browser
const results = []
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: '/home/czechspekk/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox'],
  })
  for (const width of widths)
    for (const manifest of batch) {
      const id = manifest.target.eventDateId
      const page = await browser.newPage({ viewport: { width, height: 1000 } })
      let pageErrors = 0
      const errorKinds = []
      const errorProperties = []
      const errorPaths = []
      page.on('pageerror', (error) => {
        pageErrors++
        const message = String(error.message ?? '')
        errorProperties.push(
          ...['id', 'name', 'title', 'root', 'map', 'sections', 'path'].filter((property) =>
            message.includes("reading '" + property + "'"),
          ),
        )
        errorPaths.push(
          ...(
            String(error.stack ?? '').match(
              /(?:src|node_modules)\/[A-Za-z0-9_@.\/()\[\]-]+:\d+(?::\d+)?/g,
            ) ?? []
          ).slice(0, 5),
        )
        errorKinds.push(
          ...[
            'TypeError',
            'ReferenceError',
            'ChunkLoadError',
            'Hydration',
            'Cannot read properties',
            'Failed to fetch',
            'Module not found',
            'Cannot find module',
            'Connection terminated',
            'timeout',
          ].filter((kind) => message.includes(kind)),
        )
      })
      const result = { id, sourceFile: manifest.sourceFile, width, mode, expectedId: id }
      try {
        const pathname =
          mode === 'fixture'
            ? `/editorial-qa/${id}`
            : `/trips/${manifest.target.eventSlug}?date=${id}`
        const response = await page.goto(origin + pathname, {
          waitUntil: 'networkidle',
          timeout: 120000,
        })
        result.status = response?.status() ?? null
        if (result.status !== 200) throw new Error('Unexpected route status')
        const dataText =
          mode === 'fixture'
            ? await page
                .locator('#editorial-qa-data')
                .textContent({ timeout: 5000 })
                .catch(() => null)
            : null
        const fixture =
          mode === 'public'
            ? JSON.parse(
                await fs.readFile(`${output}/fixture-${id}-1440.json`, 'utf8').catch(() => 'null'),
              )
            : null
        const data = dataText
          ? JSON.parse(dataText)
          : fixture
            ? {
                selectedId: null,
                expectedText: fixture.expandedExpectedText,
                sectionHeadings: fixture.sectionHeadings.map((h) => ({
                  key: h.key,
                  text: h.text,
                  accentTexts: h.expectedAccentTexts,
                })),
              }
            : null
        result.fixtureMetadataPresent = !!data
        result.selectedId =
          Number(
            await page
              .locator('[data-event-date-id]')
              .first()
              .getAttribute('data-event-date-id')
              .catch(() => null),
          ) ||
          data?.selectedId ||
          null
        result.exactSelection = result.selectedId === id
        await page.locator('main img').evaluateAll((xs) => xs.forEach((x) => (x.loading = 'eager')))
        await page
          .waitForFunction(
            () => Array.from(document.querySelectorAll('main img')).every((x) => x.complete),
            {},
            { timeout: 30000 },
          )
          .catch(() => {})
        await page.locator('main details').evaluateAll((xs) => xs.forEach((x) => (x.open = true)))
        const dom = await page.locator('main').evaluate((main) => {
          const clone = main.cloneNode(true)
          clone.querySelectorAll('script,style').forEach((n) => n.remove())
          const probe = document.createElement('span')
          probe.style.color = 'var(--theme-color-accent)'
          main.append(probe)
          const themeAccent = getComputedStyle(probe).color
          probe.remove()
          const headings = Array.from(main.querySelectorAll('h1,h2,h3')).map((h) => ({
            text: h.textContent,
            accents: Array.from(h.querySelectorAll('[class*="accent"]')).map((a) => ({
              text: a.textContent,
              color: getComputedStyle(a).color,
            })),
            breaks: h.querySelectorAll('br').length,
          }))
          return {
            text: clone.textContent,
            headings,
            themeAccent,
            h1: main.querySelectorAll('h1').length,
            overflow: document.documentElement.scrollWidth > innerWidth,
            missingImages: Array.from(main.querySelectorAll('img')).filter(
              (x) => !x.complete || x.naturalWidth === 0,
            ).length,
            imageCount: main.querySelectorAll('img').length,
          }
        })
        const expected = data?.expectedText ?? manifest.expectedText
        result.expandedTextAvailable = !!data?.expectedText
        result.expandedExpectedText = data?.expectedText ?? null
        result.totalExpected = expected.length
        const haystack = compact(dom.text)
        result.missingText = expected.filter((t) => !haystack.includes(compact(t)))
        result.rawTokens =
          /\{(?:price|weeklyPrice|durationDays|durationWeeks|dates|country|capacity|location|coaches)\}/.test(
            dom.text,
          )
        result.sectionHeadings = (
          data?.sectionHeadings ??
          manifest.editorial.sections
            .filter((s) => s.visibility !== 'hide')
            .map((s) => ({
              key: s.key,
              text: s.headingParts?.length ? s.headingParts.map((p) => p.text).join('') : s.heading,
              accentTexts: s.headingParts?.filter((p) => p.accent).map((p) => p.text) ?? [],
            }))
        )
          .filter((s) => s.text)
          .map((s) => {
            const found = dom.headings.find((h) => compact(h.text) === compact(s.text))
            const expectedParts = (s.accentTexts ?? []).map(compact)
            const actualParts = (found?.accents ?? []).map((a) => compact(a.text))
            return {
              key: s.key,
              text: s.text,
              present: !!found,
              expectedAccentTexts: s.accentTexts ?? [],
              expectedAccentCount: expectedParts.length,
              actualAccentCount: actualParts.length,
              accentsMatch:
                expectedParts.length === actualParts.length &&
                expectedParts.every((t, i) => t === actualParts[i]),
              accentColors: (found?.accents ?? []).map((a) => a.color),
            }
          })
        const heroParts = manifest.editorial.hero?.titleParts ?? []
        const hero = dom.headings.find(
          (h) =>
            compact(h.text) === compact(data?.heroHeading ?? heroParts.map((p) => p.text).join('')),
        )
        result.themeAccent = dom.themeAccent
        result.accentColorsMatch = dom.headings.every((h) =>
          h.accents.every((a) => a.color === dom.themeAccent),
        )
        result.hero = {
          present: !!hero,
          expectedAccentCount: heroParts.filter((p) => p.accent).length,
          actualAccentCount: hero?.accents.length ?? 0,
          expectedBreaks: heroParts.filter((p, i) => p.breakBefore && i > 0).length,
          actualBreaks: hero?.breaks ?? 0,
        }
        Object.assign(result, {
          h1: dom.h1,
          overflow: dom.overflow,
          pageErrors,
          missingImages: dom.missingImages,
          imageCount: dom.imageCount,
        })
        result.pass =
          result.accentColorsMatch &&
          result.status === 200 &&
          result.exactSelection &&
          result.totalExpected > 0 &&
          result.missingText.length === 0 &&
          !result.rawTokens &&
          !result.overflow &&
          pageErrors === 0 &&
          result.missingImages === 0 &&
          result.h1 === 1 &&
          result.sectionHeadings.every((h) => h.present && h.accentsMatch) &&
          result.hero.present &&
          result.hero.expectedAccentCount === result.hero.actualAccentCount &&
          result.hero.expectedBreaks === result.hero.actualBreaks &&
          (mode === 'public' || result.expandedTextAvailable)
        await page.screenshot({ path: `${output}/${mode}-${id}-${width}.png`, fullPage: true })
      } catch {
        result.pass = false
        result.error = 'Browser case did not complete; inspect safe screenshot and route health'
        result.pageErrors = pageErrors
        result.errorKinds = [...new Set(errorKinds)]
        result.errorProperties = [...new Set(errorProperties)]
        result.errorPaths = [...new Set(errorPaths)].slice(0, 5)
        await page
          .screenshot({ path: `${output}/${mode}-${id}-${width}-error.png`, fullPage: true })
          .catch(() => {})
      }
      results.push(result)
      await fs.writeFile(
        `${output}/${mode}-${id}-${width}.json`,
        JSON.stringify(result, null, 2) + '\n',
      )
      console.log(
        JSON.stringify({
          id,
          width,
          pass: result.pass,
          status: result.status,
          exactSelection: result.exactSelection,
          totalExpected: result.totalExpected,
          missing: result.missingText?.length,
          headingFailures: result.sectionHeadings?.filter((h) => !h.present || !h.accentsMatch)
            .length,
          overflow: result.overflow,
          missingImages: result.missingImages,
          pageErrors: result.pageErrors,
        }),
      )
      await page.close()
    }
  await fs.writeFile(
    `${output}/${mode}-matrix.json`,
    JSON.stringify(
      { mode, cases: results.length, passed: results.filter((r) => r.pass).length, results },
      null,
      2,
    ) + '\n',
  )
  if (results.some((r) => !r.pass)) process.exitCode = 1
} catch {
  console.log('QA harness stopped safely before completion')
  process.exitCode = 1
} finally {
  await browser?.close()
}
