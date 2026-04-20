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
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return {}

  const html = await readLimited(res, MAX_BYTES)
  return parseOg(html, url)
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
