export function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export type OgFields = {
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  siteName?: string | null
}

export type LinkLike = {
  targetUrl: string
  scraped?: OgFields | null
  override?: (OgFields & { image?: { url?: string | null; sizes?: Record<string, { url?: string | null }> } | string | null }) | null
}

export function absoluteMediaUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const base = process.env.PAYLOAD_PUBLIC_SERVER_URL?.replace(/\/$/, '') ?? ''
  return `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export type MergedOg = {
  title: string
  description: string
  imageUrl: string
  siteName: string
  url: string
}

export function mergeOg(link: LinkLike): MergedOg {
  const o = link.override ?? {}
  const s = link.scraped ?? {}

  let overrideImageUrl: string | undefined
  if (o.image && typeof o.image === 'object') {
    overrideImageUrl = o.image.sizes?.og?.url ?? o.image.url ?? undefined
  }

  return {
    title: pickString(o.title, s.title) ?? link.targetUrl,
    description: pickString(o.description, s.description) ?? '',
    imageUrl: absoluteMediaUrl(overrideImageUrl) ?? pickString(s.imageUrl) ?? '',
    siteName: pickString(o.siteName, s.siteName) ?? safeHostname(link.targetUrl),
    url: link.targetUrl,
  }
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function pickString(...values: Array<string | null | undefined>): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length > 0) return v
  }
  return undefined
}
