import { headers as getHeaders } from 'next/headers.js'
import { redirect, notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { isFrontendUser } from '@/access/links'
import { absoluteMediaUrl } from '@/utils/url'
import { EditOgForm } from './EditOgForm'
import { RevisionHistory } from './RevisionHistory'
import '../../../styles.css'

type Props = { params: Promise<{ id: string }> }

export default async function EditLinkPage({ params }: Props) {
  const { id } = await params
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!isFrontendUser(user) || !user) redirect(`/login?next=/links/${id}/edit`)

  const numericId = Number(id)
  if (Number.isNaN(numericId)) notFound()

  let link
  try {
    link = await payload.findByID({
      collection: 'links',
      id: numericId,
      depth: 1,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }
  if (!link) notFound()

  const ownerId =
    typeof link.owner === 'object' && link.owner !== null
      ? (link.owner as { id: string | number }).id
      : link.owner
  if (ownerId !== user.id) redirect('/')

  const overrideImage =
    link.override?.image && typeof link.override.image === 'object'
      ? (link.override.image as { id: number; url?: string | null; sizes?: { og?: { url?: string | null } } })
      : null

  const initial = {
    title: link.override?.title ?? '',
    description: link.override?.description ?? '',
    siteName: link.override?.siteName ?? '',
    imageId: overrideImage?.id ?? null,
    imageUrl: absoluteMediaUrl(overrideImage?.sizes?.og?.url ?? overrideImage?.url ?? null) ?? null,
  }

  const scraped = {
    title: link.scraped?.title ?? '',
    description: link.scraped?.description ?? '',
    siteName: link.scraped?.siteName ?? '',
    imageUrl: link.scraped?.imageUrl ?? '',
  }

  return (
    <div className="page">
      <section className="hero">
        <p className="hero-eyebrow">revise this link</p>
        <h1 className="hero-title">
          Rewrite the <em>headline</em>.
        </h1>
        <p className="hero-deck">{link.targetUrl}</p>
      </section>

      <section>
        <EditOgForm
          key={String(link.updatedAt)}
          linkId={numericId}
          targetUrl={link.targetUrl}
          initial={initial}
          scraped={scraped}
        />
      </section>

      <section>
        <RevisionHistory linkId={numericId} />
      </section>

      <p className="page-footnote">
        <a href="/">← back to your archive</a>
      </p>
    </div>
  )
}
