'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { RedditEmbed } from './embeds/RedditEmbed'
import { DiscordEmbed } from './embeds/DiscordEmbed'
import { IMessageBubble } from './embeds/IMessageBubble'
import { hostFromUrl, type EmbedTags } from './embeds/types'
import { normalizeHost } from '@/utils/url'
import './embeds/embeds.css'

type ScrapedResponse = {
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
}

type Override = {
  title?: string
  description?: string
  siteName?: string
  imageId?: number
  imageObjectUrl?: string
  imageFile?: File
}

type ShortenResult = { id: number; slug: string; shortUrl: string }

const DEBOUNCE_MS = 450

export function ShortenComposer({
  canEdit,
  canCustomSlug = false,
}: {
  canEdit: boolean
  canCustomSlug?: boolean
}) {
  const router = useRouter()
  const [targetUrl, setTargetUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [scraped, setScraped] = useState<ScrapedResponse | null>(null)
  const [override, setOverride] = useState<Override>({})
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ShortenResult | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const validUrl = useMemo(() => isProbablyUrl(targetUrl), [targetUrl])
  const redirectHost = normalizeHost(process.env.NEXT_PUBLIC_REDIRECT_HOST, 'l.cny.sh')

  useEffect(() => {
    if (!validUrl) {
      setScraped(null)
      return
    }
    const ctrl = new AbortController()
    abortRef.current?.abort()
    abortRef.current = ctrl
    setScrapeLoading(true)
    const handle = setTimeout(async () => {
      try {
        const res = await fetch('/api/links/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl }),
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error('Preview failed')
        const data = (await res.json()) as ScrapedResponse
        if (!ctrl.signal.aborted) setScraped(data)
      } catch (err) {
        if (!ctrl.signal.aborted && err instanceof Error && err.name !== 'AbortError') {
          setScraped({ title: null, description: null, imageUrl: null, siteName: null })
        }
      } finally {
        if (!ctrl.signal.aborted) setScrapeLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(handle)
      ctrl.abort()
    }
  }, [targetUrl, validUrl])

  // Reset overrides + result when url changes meaningfully
  useEffect(() => {
    setResult(null)
    setError(null)
    setOverride((o) => ({ ...o, imageObjectUrl: undefined, imageFile: undefined, imageId: undefined }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUrl])

  const tags: EmbedTags = {
    title: override.title ?? scraped?.title ?? '',
    description: override.description ?? scraped?.description ?? '',
    siteName: override.siteName ?? scraped?.siteName ?? hostFromUrl(targetUrl),
    imageUrl: override.imageObjectUrl ?? scraped?.imageUrl ?? null,
  }

  function setText(field: 'title' | 'description' | 'siteName', value: string) {
    setOverride((o) => ({ ...o, [field]: value }))
  }

  function pickImage() {
    fileInputRef.current?.click()
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setOverride((o) => ({
      ...o,
      imageFile: file,
      imageObjectUrl: URL.createObjectURL(file),
      imageId: undefined,
    }))
  }

  async function uploadImage(file: File): Promise<number> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('_payload', JSON.stringify({ alt: file.name }))
    const res = await fetch('/api/media', { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.errors?.[0]?.message ?? 'Image upload failed')
    }
    const data = await res.json()
    return data.doc.id
  }

  async function onSubmit() {
    if (!validUrl) return
    setSubmitting(true)
    setError(null)
    try {
      let imageId = override.imageId
      if (canEdit && override.imageFile) {
        imageId = await uploadImage(override.imageFile)
      }
      const overridePayload = canEdit
        ? prune({
            title: override.title,
            description: override.description,
            siteName: override.siteName,
            image: imageId,
          })
        : undefined

      const trimmedSlug = customSlug.trim()
      const res = await fetch('/api/links/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          ...(overridePayload ? { override: overridePayload } : {}),
          ...(canCustomSlug && trimmedSlug ? { customSlug: trimmedSlug } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Shorten failed')
      setResult(data as ShortenResult)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function copy() {
    if (!result) return
    await navigator.clipboard.writeText(result.shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function reset() {
    setOverride({})
    setCustomSlug('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="composer">
      <div className="composer-input">
        <input
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="paste a link to begin…"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          disabled={submitting}
        />
        {scrapeLoading && <span className="composer-spinner" aria-label="Loading preview" />}
      </div>

      {validUrl && canCustomSlug && (
        <div className="composer-slug">
          <span className="composer-slug-prefix">{redirectHost}/</span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="optional custom key"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
            maxLength={64}
            disabled={submitting}
          />
        </div>
      )}

      {validUrl && (
        <>
          {!canEdit ? (
            <p className="composer-cta">
              These previews are read-only.
              <a href="/login">Sign in</a>
              or
              <a href="/register">create an account</a>
              to rewrite the headline before sharing.
            </p>
          ) : (
            <p className="specimens-meta">click any text or image to revise</p>
          )}

          <div className="embed-grid">
            <div className="embed-stage">
              <p className="embed-stage-label">Reddit</p>
              <RedditEmbed
                targetUrl={targetUrl}
                tags={tags}
                editable={canEdit}
                onTextChange={setText}
                onImageClick={pickImage}
              />
            </div>
            <div className="embed-stage">
              <p className="embed-stage-label">Discord</p>
              <DiscordEmbed
                targetUrl={targetUrl}
                tags={tags}
                editable={canEdit}
                onTextChange={setText}
                onImageClick={pickImage}
              />
            </div>
            <div className="embed-stage">
              <p className="embed-stage-label">iMessage</p>
              <IMessageBubble
                targetUrl={targetUrl}
                tags={tags}
                editable={canEdit}
                onTextChange={setText}
                onImageClick={pickImage}
              />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFile}
          />

          <div className="composer-actions">
            {canEdit && (
              <p className="annotation">
                {hasChanges(override) ? 'your edits are saved with this link' : 'looks good as-is, or click in to revise'}
              </p>
            )}
            {hasChanges(override) && (
              <button
                type="button"
                className="secondary"
                onClick={reset}
                disabled={submitting}
              >
                Discard edits
              </button>
            )}
            <button type="button" onClick={onSubmit} disabled={submitting || !validUrl}>
              {submitting ? 'Sending…' : result ? 'Send another' : 'Shorten link'}
            </button>
          </div>

          {result && (
            <div className="composer-result">
              <p className="result-meta">your link is ready</p>
              <a href={result.shortUrl} target="_blank" rel="noopener noreferrer">
                {result.shortUrl}
              </a>
              <div className="result-actions">
                <button type="button" onClick={copy}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
                {canEdit && (
                  <a className="edit-later" href={`/links/${result.id}/edit`}>
                    Revise later
                  </a>
                )}
              </div>
            </div>
          )}

          {error && <p className="shorten-error">{error}</p>}
        </>
      )}
    </div>
  )
}

function isProbablyUrl(value: string): boolean {
  if (!value || value.length < 4) return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function hasChanges(o: Override): boolean {
  return Boolean(o.title || o.description || o.siteName || o.imageFile || o.imageId)
}

function prune<T extends Record<string, unknown>>(o: T): Partial<T> | undefined {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== '' && v !== null) out[k] = v
  }
  return Object.keys(out).length > 0 ? (out as Partial<T>) : undefined
}
