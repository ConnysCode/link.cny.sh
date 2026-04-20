import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { isFrontendUser } from '@/access/links'
import { normalizeHost } from '@/utils/url'
import { ShortenComposer } from './components/ShortenComposer'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const frontendUser = isFrontendUser(user) ? user : null

  let myLinks: Array<{ id: string | number; slug: string; targetUrl: string }> = []
  if (frontendUser) {
    const result = await payload.find({
      collection: 'links',
      where: { owner: { equals: frontendUser.id } },
      sort: '-createdAt',
      limit: 20,
      depth: 0,
      user: frontendUser,
      overrideAccess: false,
    })
    myLinks = result.docs
      .filter((d): d is typeof d & { slug: string } => typeof d.slug === 'string' && d.slug.length > 0)
      .map((d) => ({ id: d.id, slug: d.slug, targetUrl: d.targetUrl }))
  }

  const redirectHost = normalizeHost(process.env.NEXT_PUBLIC_REDIRECT_HOST, 'l.cny.sh')

  return (
    <div className="page">
      <nav className="topbar">
        <a href="/" className="wordmark">link.cny.sh</a>
        <div className="topbar-right">
          {frontendUser ? (
            <>
              <span>{frontendUser.email}</span>
              <a href="/logout">Sign out</a>
            </>
          ) : (
            <>
              <a href="/login">Sign in</a>
              <a href="/register" className="topbar-cta">Get started</a>
            </>
          )}
        </div>
      </nav>

      <section className="hero">
        <p className="hero-eyebrow">a quieter link shortener</p>
        <h1 className="hero-title">
          Send a link.<br /><em>Make it land.</em>
        </h1>
        <p className="hero-deck">
          Paste a URL. See exactly how it will look on Reddit, Discord and iMessage —
          and gently rewrite the headline before you share it.
        </p>
      </section>

      <section>
        <ShortenComposer
          canEdit={!!frontendUser}
          canCustomSlug={Array.isArray(frontendUser?.roles) && frontendUser.roles.includes('special')}
        />
      </section>

      {frontendUser && myLinks.length > 0 && (
        <section>
          <h2 className="section-heading">
            Your <em>archive</em>.
          </h2>
          <ul className="link-list">
            {myLinks.map((l) => (
              <li key={String(l.id)}>
                <a href={`http://${redirectHost}:3000/${l.slug}`} target="_blank" rel="noopener noreferrer">
                  {redirectHost}/{l.slug}
                </a>
                <span className="link-target">{l.targetUrl}</span>
                <a className="edit-link" href={`/links/${l.id}/edit`}>
                  Revise
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="page-footer">
        <span>link.cny.sh</span>
        <span className="colophon">made quietly, with care</span>
        <span>l.cny.sh</span>
      </footer>
    </div>
  )
}
