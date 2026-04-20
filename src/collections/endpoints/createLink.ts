import type { Endpoint } from 'payload'

import { isFrontendUser, isSpecialUser } from '@/access/links'
import { isValidHttpUrl, normalizeHost } from '@/utils/url'

const SLUG_FORMAT = /^[a-z0-9][a-z0-9-_]{0,62}[a-z0-9]$|^[a-z0-9]$/i
const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'login',
  'logout',
  'register',
  'links',
  '_next',
  'r',
  'static',
  'assets',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

type OverrideInput = {
  title?: string | null
  description?: string | null
  siteName?: string | null
  image?: number | null
}

export const createLinkEndpoint: Endpoint = {
  path: '/shorten',
  method: 'post',
  handler: async (req) => {
    let body: unknown
    try {
      body = await req.json?.()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const targetUrl = (body as { targetUrl?: unknown } | null)?.targetUrl
    if (!isValidHttpUrl(targetUrl)) {
      return Response.json({ error: 'targetUrl must be a valid http(s) URL' }, { status: 400 })
    }

    const rawOverride = (body as { override?: OverrideInput } | null)?.override
    const override = isFrontendUser(req.user) ? sanitizeOverride(rawOverride) : undefined

    const customSlugRaw = (body as { customSlug?: unknown } | null)?.customSlug
    let customSlug: string | undefined
    if (typeof customSlugRaw === 'string' && customSlugRaw.trim()) {
      if (!isSpecialUser(req.user)) {
        return Response.json(
          { error: 'Custom slugs require a special account' },
          { status: 403 },
        )
      }
      const candidate = customSlugRaw.trim()
      if (!SLUG_FORMAT.test(candidate)) {
        return Response.json(
          { error: 'Slug may only contain letters, digits, dashes and underscores (max 64)' },
          { status: 400 },
        )
      }
      if (RESERVED_SLUGS.has(candidate.toLowerCase())) {
        return Response.json({ error: 'That slug is reserved' }, { status: 400 })
      }
      const taken = await req.payload.find({
        collection: 'links',
        where: { slug: { equals: candidate } },
        limit: 1,
        req,
      })
      if (taken.totalDocs > 0) {
        return Response.json({ error: 'That slug is already taken' }, { status: 409 })
      }
      customSlug = candidate
    }

    const created = await req.payload.create({
      collection: 'links',
      data: {
        targetUrl: targetUrl as string,
        ...(customSlug ? { slug: customSlug } : {}),
        ...(req.user ? { owner: req.user.id as number } : {}),
        ...(override ? { override } : {}),
      },
      req,
      overrideAccess: true,
    })

    const redirectHost = normalizeHost(process.env.NEXT_PUBLIC_REDIRECT_HOST, 'l.cny.sh')
    const protocol =
      redirectHost === 'localhost' || redirectHost.startsWith('127.') ? 'http' : 'https'
    const port = protocol === 'http' ? ':3000' : ''

    return Response.json({
      id: created.id,
      slug: created.slug,
      shortUrl: `${protocol}://${redirectHost}${port}/${created.slug}`,
    })
  },
}

function sanitizeOverride(input: OverrideInput | undefined): OverrideInput | undefined {
  if (!input || typeof input !== 'object') return undefined
  const out: OverrideInput = {}
  if (typeof input.title === 'string' && input.title.trim()) out.title = input.title.trim()
  if (typeof input.description === 'string' && input.description.trim())
    out.description = input.description.trim()
  if (typeof input.siteName === 'string' && input.siteName.trim())
    out.siteName = input.siteName.trim()
  if (typeof input.image === 'number') out.image = input.image
  return Object.keys(out).length > 0 ? out : undefined
}
