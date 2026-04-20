const FETCH_TIMEOUT_MS = 8000
const MAX_BYTES = 1536 * 1024
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export type ScrapedOg = {
  title?: string
  description?: string
  imageUrl?: string
  siteName?: string
}

export async function scrapeOg(url: string): Promise<ScrapedOg> {
  // YouTube serves reduced/consent-gated HTML to datacenter IPs — even with a CONSENT cookie.
  // Use the official oEmbed endpoint for reliable title + thumbnail, then still try HTML for description.
  if (isYouTubeUrl(url)) {
    const [oembed, html] = await Promise.all([fetchYouTubeOembed(url), fetchHtml(url)])
    const scraped = html ? parseOg(html, url) : {}
    return prune({
      title: oembed?.title ?? scraped.title,
      description: scraped.description,
      imageUrl: oembed?.imageUrl ?? scraped.imageUrl,
      siteName: oembed?.siteName ?? scraped.siteName ?? 'YouTube',
    })
  }

  const html = await fetchHtml(url)
  if (!html) return {}
  return parseOg(html, url)
}

async function fetchHtml(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        // Bypass the EU cookie-consent interstitial on Google properties.
        Cookie: 'CONSENT=YES+',
      },
    })
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) return undefined
    return await readLimited(res, MAX_BYTES)
  } catch {
    return undefined
  }
}

function isYouTubeUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com'
  } catch {
    return false
  }
}

async function fetchYouTubeOembed(url: string): Promise<ScrapedOg | undefined> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    })
    if (!res.ok) return undefined
    const data = (await res.json()) as {
      title?: string
      author_name?: string
      thumbnail_url?: string
      provider_name?: string
    }
    return {
      title: data.title,
      imageUrl: data.thumbnail_url,
      siteName: data.provider_name,
    }
  } catch {
    return undefined
  }
}

async function readLimited(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let text = ''
  let total = 0
  while (total < max) {
    const { value, done } = await reader.read()
    if (done) break
    total += value.length
    text += decoder.decode(value, { stream: true })
    if (text.toLowerCase().includes('</head>')) {
      try {
        await reader.cancel()
      } catch {}
      break
    }
    if (total >= max) {
      try {
        await reader.cancel()
      } catch {}
      break
    }
  }
  text += decoder.decode()
  return text
}

function parseOg(html: string, baseUrl: string): ScrapedOg {
  const headEnd = html.toLowerCase().indexOf('</head>')
  const head = headEnd >= 0 ? html.slice(0, headEnd + 7) : html
  const result: ScrapedOg = {}

  result.title =
    metaContent(head, /property=["']og:title["']/) ??
    metaContent(head, /name=["']twitter:title["']/) ??
    extractTitle(head)
  result.description =
    metaContent(head, /property=["']og:description["']/) ??
    metaContent(head, /name=["']twitter:description["']/) ??
    metaContent(head, /name=["']description["']/)
  result.siteName = metaContent(head, /property=["']og:site_name["']/)

  const image =
    metaContent(head, /property=["']og:image["']/) ??
    metaContent(head, /name=["']twitter:image["']/)
  if (image) {
    try {
      result.imageUrl = new URL(image, baseUrl).toString()
    } catch {
      result.imageUrl = image
    }
  }

  return prune(result)
}

function metaContent(html: string, attrRegex: RegExp): string | undefined {
  const tagRegex = new RegExp(`<meta\\b[^>]*${attrRegex.source}[^>]*>`, 'i')
  const tag = html.match(tagRegex)?.[0]
  if (!tag) return undefined
  const m = tag.match(/content=["']([^"']*)["']/i)
  return m?.[1]?.trim() || undefined
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title>([^<]*)<\/title>/i)
  return m?.[1]?.trim() || undefined
}

function prune<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) {
    if (obj[k] === undefined || obj[k] === '') delete obj[k]
  }
  return obj
}
