import type { CollectionBeforeChangeHook } from 'payload'

import { scrapeOg } from '@/utils/og-scraper'

export const scrapeOgTagsOnCreate: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const targetUrl: unknown = data?.targetUrl
  if (typeof targetUrl !== 'string' || targetUrl.length === 0) return data

  try {
    const scraped = await scrapeOg(targetUrl)
    return {
      ...data,
      scraped: {
        title: scraped.title ?? null,
        description: scraped.description ?? null,
        imageUrl: scraped.imageUrl ?? null,
        siteName: scraped.siteName ?? null,
        fetchedAt: new Date().toISOString(),
      },
    }
  } catch (err) {
    req.payload.logger.warn({ err, targetUrl }, 'OG scrape failed')
    return data
  }
}
