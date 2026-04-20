import type { Endpoint } from 'payload'

import { isValidHttpUrl } from '@/utils/url'
import { scrapeOg } from '@/utils/og-scraper'

export const previewLinkEndpoint: Endpoint = {
  path: '/preview',
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

    try {
      const scraped = await scrapeOg(targetUrl as string)
      return Response.json({
        title: scraped.title ?? null,
        description: scraped.description ?? null,
        imageUrl: scraped.imageUrl ?? null,
        siteName: scraped.siteName ?? null,
      })
    } catch {
      return Response.json({
        title: null,
        description: null,
        imageUrl: null,
        siteName: null,
      })
    }
  },
}
