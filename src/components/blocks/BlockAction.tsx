'use client'

import type { MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { normalizeActionHref } from '@/lib/safe-url'
import { type AnalyticsEventParams, trackEvent } from '@/lib/analytics'

export type BlockActionAnalytics = {
  enabled?: boolean | null
  eventName?: string | null
  actionId?: string | null
  location?: string | null
  intent?: string | null
  customLabel?: string | null
}

export type BlockActionAnalyticsDefaults = {
  blockType: string
  actionSlot: 'primary' | 'secondary'
  location: string
  pageSlug?: string | null
  blockId?: string | null
  blockIndex?: number
}

type BlockActionProps = {
  href?: string | null
  label?: string | null
  className?: string
  analytics?: BlockActionAnalytics | null
  analyticsDefaults?: BlockActionAnalyticsDefaults
}

export function BlockAction({
  href,
  label,
  className,
  analytics,
  analyticsDefaults,
}: BlockActionProps) {
  const router = useRouter()
  if (!href || !label) return null
  const safeHref = normalizeActionHref(href)
  if (!safeHref) return null

  const buildEvent = (): { eventName: string; params: AnalyticsEventParams } | null => {
    if (analytics?.enabled === false || !analyticsDefaults) return null

    const location =
      analytics?.location && analytics.location !== 'auto'
        ? analytics.location
        : analyticsDefaults.location

    return {
      eventName: analytics?.eventName?.trim() || 'cta_click',
      params: {
        action_id:
          analytics?.actionId?.trim() ||
          defaultActionId({ label, location, analyticsDefaults }),
        action_slot: analyticsDefaults.actionSlot,
        block_id: analyticsDefaults.blockId,
        block_index: analyticsDefaults.blockIndex,
        block_type: analyticsDefaults.blockType,
        intent: analytics?.intent || 'navigation',
        link_text: analytics?.customLabel?.trim() || label,
        link_url: safeHref,
        location,
        page_slug: analyticsDefaults.pageSlug,
      },
    }
  }

  const handleExternalClick = () => {
    const event = buildEvent()
    if (event) trackEvent(event.eventName, event.params)
  }

  const handleInternalClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const analyticsEvent = buildEvent()
    if (!analyticsEvent || event.defaultPrevented || shouldLetBrowserHandleClick(event)) return

    event.preventDefault()
    let navigated = false
    const navigate = () => {
      if (navigated) return
      navigated = true
      router.push(safeHref)
    }

    trackEvent(analyticsEvent.eventName, analyticsEvent.params)
    window.setTimeout(navigate, 1200)
  }

  if (safeHref.startsWith('/')) {
    return (
      <Link href={safeHref} className={className} onClick={handleInternalClick}>
        {label}
      </Link>
    )
  }
  return (
    <a
      href={safeHref}
      className={className}
      onClick={handleExternalClick}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  )
}

function shouldLetBrowserHandleClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey
}

function defaultActionId({
  label,
  location,
  analyticsDefaults,
}: {
  label: string
  location: string
  analyticsDefaults: BlockActionAnalyticsDefaults
}) {
  return [
    analyticsDefaults.pageSlug ?? 'page',
    analyticsDefaults.blockType,
    analyticsDefaults.blockId ?? analyticsDefaults.blockIndex ?? 'block',
    analyticsDefaults.actionSlot,
    location,
    label,
  ]
    .join('_')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100)
}
