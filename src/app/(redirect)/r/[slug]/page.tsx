import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { mergeOg, type LinkLike } from '@/utils/url'

type Params = { slug: string }
type Props = { params: Promise<Params> }

async function fetchLinkBySlug(slug: string) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const result = await payload.find({
    collection: 'links',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const link = await fetchLinkBySlug(slug)
  if (!link) return { title: 'Not found' }
  const og = mergeOg(link as unknown as LinkLike)
  return {
    title: og.title,
    description: og.description,
    openGraph: {
      title: og.title,
      description: og.description,
      images: og.imageUrl ? [{ url: og.imageUrl }] : undefined,
      siteName: og.siteName,
      url: og.url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: og.title,
      description: og.description,
      images: og.imageUrl ? [og.imageUrl] : undefined,
    },
  }
}

export default async function RedirectPage({ params }: Props) {
  const { slug } = await params
  const link = await fetchLinkBySlug(slug)
  if (!link) notFound()

  void incrementClickCount(link.id)

  const targetUrl: string = link.targetUrl
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${targetUrl}`} />
      <noscript>
        <a href={targetUrl}>Continue to {targetUrl}</a>
      </noscript>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(targetUrl)})`,
        }}
      />
    </>
  )
}

async function incrementClickCount(id: string | number): Promise<void> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const current = await payload.findByID({ collection: 'links', id, depth: 0 })
    await payload.update({
      collection: 'links',
      id,
      data: { clickCount: ((current as { clickCount?: number }).clickCount ?? 0) + 1 },
      overrideAccess: true,
      context: { skipHooks: true },
    })
  } catch {
    // best-effort; never block the redirect
  }
}
