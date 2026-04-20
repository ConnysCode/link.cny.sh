'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import { RedditEmbed } from '../../../components/embeds/RedditEmbed'
import { DiscordEmbed } from '../../../components/embeds/DiscordEmbed'
import { IMessageBubble } from '../../../components/embeds/IMessageBubble'
import { hostFromUrl, type EmbedTags } from '../../../components/embeds/types'
import '../../../components/embeds/embeds.css'
import { ImageCropper } from './ImageCropper'

type Initial = {
  title: string
  description: string
  siteName: string
  imageId: number | null
  imageUrl: string | null
}

type Scraped = {
  title: string
  description: string
  siteName: string
  imageUrl: string
}

export function EditOgForm({
  linkId,
  targetUrl,
  initial,
  scraped,
}: {
  linkId: number
  targetUrl: string
  initial: Initial
  scraped: Scraped
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [siteName, setSiteName] = useState(initial.siteName)
  const [imageId, setImageId] = useState<number | null>(initial.imageId)
  const [imagePreview, setImagePreview] = useState<string | null>(initial.imageUrl)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [croppingSrc, setCroppingSrc] = useState<string | null>(null)
  const [croppingName, setCroppingName] = useState<string>('cropped.jpg')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (croppingSrc?.startsWith('blob:')) URL.revokeObjectURL(croppingSrc)
    }
  }, [croppingSrc])

  const tags: EmbedTags = {
    title: title || scraped.title || '',
    description: description || scraped.description || '',
    siteName: siteName || scraped.siteName || hostFromUrl(targetUrl),
    imageUrl: imagePreview || scraped.imageUrl || null,
  }

  function setText(field: 'title' | 'description' | 'siteName', value: string) {
    if (field === 'title') setTitle(value)
    else if (field === 'description') setDescription(value)
    else setSiteName(value)
  }

  function pickImage() {
    fileInputRef.current?.click()
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setCroppingName(file.name.replace(/\.[^.]+$/, '') + '.jpg')
    setCroppingSrc(objectUrl)
    e.target.value = ''
  }

  function onCropConfirm(file: File) {
    if (croppingSrc?.startsWith('blob:')) URL.revokeObjectURL(croppingSrc)
    setCroppingSrc(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function openCropOnExisting() {
    if (!imagePreview) return
    setCroppingName(imageFile?.name ?? 'cropped.jpg')
    setCroppingSrc(imagePreview)
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

  async function onSave() {
    setError(null)
    setSubmitting(true)
    try {
      let nextImageId = imageId
      if (imageFile) {
        nextImageId = await uploadImage(imageFile)
      }
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          override: {
            title: title || null,
            description: description || null,
            siteName: siteName || null,
            image: nextImageId,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message ?? 'Save failed')
      }
      setImageId(nextImageId)
      setImageFile(null)
      setSavedAt(new Date())
      window.dispatchEvent(new CustomEvent('link:revised', { detail: { linkId } }))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function clearOverrides() {
    if (!confirm('Reset all overrides for this link?')) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          override: { title: null, description: null, siteName: null, image: null },
        }),
      })
      if (!res.ok) throw new Error('Reset failed')
      setTitle('')
      setDescription('')
      setSiteName('')
      setImageId(null)
      setImagePreview(null)
      setImageFile(null)
      setSavedAt(new Date())
      window.dispatchEvent(new CustomEvent('link:revised', { detail: { linkId } }))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setSubmitting(false)
    }
  }

  const dirty =
    title !== initial.title ||
    description !== initial.description ||
    siteName !== initial.siteName ||
    imageFile !== null

  return (
    <div className="composer">
      <p className="specimens-meta">click any text or image to revise</p>

      <div className="embed-grid">
        <div className="embed-stage">
          <p className="embed-stage-label">Reddit</p>
          <RedditEmbed
            targetUrl={targetUrl}
            tags={tags}
            editable
            onTextChange={setText}
            onImageClick={pickImage}
          />
        </div>
        <div className="embed-stage">
          <p className="embed-stage-label">Discord</p>
          <DiscordEmbed
            targetUrl={targetUrl}
            tags={tags}
            editable
            onTextChange={setText}
            onImageClick={pickImage}
          />
        </div>
        <div className="embed-stage">
          <p className="embed-stage-label">iMessage</p>
          <IMessageBubble
            targetUrl={targetUrl}
            tags={tags}
            editable
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
        onChange={onFileChange}
      />

      <div className="composer-actions">
        <p className="annotation">
          {dirty
            ? 'unsaved revisions'
            : savedAt
              ? `saved ${savedAt.toLocaleTimeString()}`
              : 'click into any preview to revise'}
        </p>
        {imagePreview && (
          <button
            type="button"
            className="secondary"
            onClick={openCropOnExisting}
            disabled={submitting}
          >
            Adjust crop
          </button>
        )}
        <button
          type="button"
          className="secondary"
          onClick={clearOverrides}
          disabled={submitting}
        >
          Reset to scraped
        </button>
        <button type="button" onClick={onSave} disabled={submitting || !dirty}>
          {submitting ? 'Saving…' : 'Save revisions'}
        </button>
      </div>

      {error && <p className="shorten-error">{error}</p>}

      {croppingSrc && (
        <ImageCropper
          src={croppingSrc}
          fileName={croppingName}
          onConfirm={onCropConfirm}
          onCancel={() => {
            if (croppingSrc.startsWith('blob:')) URL.revokeObjectURL(croppingSrc)
            setCroppingSrc(null)
          }}
        />
      )}
    </div>
  )
}
