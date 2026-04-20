'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type VersionDoc = {
  id: string | number
  updatedAt: string
  version: {
    override?: {
      title?: string | null
      description?: string | null
      siteName?: string | null
      image?: number | { id: number } | null
    } | null
    scraped?: {
      title?: string | null
      description?: string | null
      siteName?: string | null
    } | null
  }
}

const FETCH_LIMIT = 25

export function RevisionHistory({ linkId }: { linkId: number }) {
  const router = useRouter()
  const [versions, setVersions] = useState<VersionDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const params = new URLSearchParams({
        'where[parent][equals]': String(linkId),
        sort: '-updatedAt',
        limit: String(FETCH_LIMIT),
        depth: '0',
      })
      const res = await fetch(`/api/links/versions?${params.toString()}`, {
        credentials: 'same-origin',
      })
      if (!res.ok) throw new Error('Could not load history')
      const data = await res.json()
      setVersions(data.docs ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load history')
    } finally {
      setLoading(false)
    }
  }, [linkId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    function onRevised(e: Event) {
      const detail = (e as CustomEvent).detail as { linkId?: number } | undefined
      if (!detail || detail.linkId === linkId) load()
    }
    window.addEventListener('link:revised', onRevised)
    return () => window.removeEventListener('link:revised', onRevised)
  }, [linkId, load])

  async function restore(versionId: string | number) {
    if (!confirm('Restore this revision? The current state will be saved as a new entry in history.')) {
      return
    }
    setRestoring(versionId)
    setError(null)
    try {
      const res = await fetch(`/api/links/versions/${versionId}`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message ?? 'Restore failed')
      }
      window.dispatchEvent(new CustomEvent('link:revised', { detail: { linkId } }))
      await load()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed')
    } finally {
      setRestoring(null)
    }
  }

  return (
    <div className="revisions">
      <h2 className="section-heading">
        Revision <em>history</em>.
      </h2>

      {loading ? (
        <div className="revisions-empty">
          <p className="revisions-empty-eyebrow">tracing the timeline</p>
          <p className="revisions-empty-deck">finding earlier versions of this link…</p>
        </div>
      ) : versions.length === 0 ? (
        <div className="revisions-empty">
          <p className="revisions-empty-eyebrow">a clean slate</p>
          <p className="revisions-empty-title">
            No revisions <em>yet</em>.
          </p>
          <p className="revisions-empty-deck">
            Every save creates a snapshot here. Edit the previews above and your earlier
            takes will start to appear, ready to roll back to.
          </p>
        </div>
      ) : (
        <ul className="revisions-list">
          {versions.map((v, i) => {
            const ov = v.version.override
            const sc = v.version.scraped
            const title = ov?.title || sc?.title || '—'
            const description = ov?.description || sc?.description || ''
            const siteName = ov?.siteName || sc?.siteName || ''
            return (
              <li key={String(v.id)}>
                <div className="rev-meta">
                  <p className="rev-time">{formatTime(v.updatedAt)}</p>
                  <p className="rev-title">{title}</p>
                  {description && <p className="rev-description">{description}</p>}
                  {siteName && <p className="rev-site">{siteName}</p>}
                </div>
                {i === 0 ? (
                  <span className="rev-current">current</span>
                ) : (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => restore(v.id)}
                    disabled={restoring !== null}
                  >
                    {restoring === v.id ? 'Restoring…' : 'Restore'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {error && <p className="shorten-error">{error}</p>}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH} h ago`
  const diffD = Math.round(diffH / 24)
  if (diffD < 7) return `${diffD} d ago`
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
