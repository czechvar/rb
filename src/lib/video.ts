export function safeVideoUrl(value?: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null

    if (isHost(url, 'youtu.be')) {
      const id = cleanSegment(url.pathname.split('/')[1])
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (isHost(url, 'youtube.com')) {
      const id = youtubeVideoId(url)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (isHost(url, 'vimeo.com')) {
      const id = vimeoVideoId(url)
      return id ? `https://player.vimeo.com/video/${id}` : null
    }

    return null
  } catch {
    return null
  }
}

function isHost(url: URL, domain: string) {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

function youtubeVideoId(url: URL) {
  const path = url.pathname.split('/').filter(Boolean)
  const id = path[0] === 'embed' || path[0] === 'shorts' ? path[1] : url.searchParams.get('v')
  const clean = cleanSegment(id)
  return clean && /^[A-Za-z0-9_-]{6,}$/.test(clean) ? clean : null
}

function vimeoVideoId(url: URL) {
  const path = url.pathname.split('/').filter(Boolean)
  const id = path[0] === 'video' ? path[1] : path[0]
  const clean = cleanSegment(id)
  return clean && /^\d+$/.test(clean) ? clean : null
}

function cleanSegment(value?: string | null) {
  return value ? decodeURIComponent(value).trim() : null
}
