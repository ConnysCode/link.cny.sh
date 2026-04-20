'use client'

import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

const OG_ASPECT = 1200 / 630

type Props = {
  src: string
  fileName?: string
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export function ImageCropper({ src, fileName = 'cropped.jpg', onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onCancel])

  async function confirm() {
    if (!areaPixels) return
    setBusy(true)
    setError(null)
    try {
      const file = await cropToFile(src, areaPixels, fileName)
      onConfirm(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop image')
      setBusy(false)
    }
  }

  return (
    <div className="cropper-overlay" role="dialog" aria-modal="true" aria-label="Crop image">
      <div className="cropper-card">
        <header className="cropper-header">
          <p className="cropper-eyebrow">crop preview image</p>
          <h2 className="cropper-title">
            Frame the <em>moment</em>.
          </h2>
          <p className="cropper-deck">
            Drag to reposition, scroll or use the slider to zoom. The frame matches how the
            image will appear on Twitter, Discord and iMessage (16∶9).
          </p>
        </header>

        <div className="cropper-canvas">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={OG_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid
          />
        </div>

        <div className="cropper-controls">
          <label className="cropper-zoom">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
            />
          </label>

          {error && <p className="cropper-error">{error}</p>}

          <div className="cropper-actions">
            <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="button" onClick={confirm} disabled={busy || !areaPixels}>
              {busy ? 'Saving…' : 'Use this crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

async function cropToFile(src: string, area: Area, fileName: string): Promise<File> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width)
  canvas.height = Math.round(area.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  )
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not create cropped image'))),
      'image/jpeg',
      0.92,
    )
  })
  return new File([blob], fileName, { type: 'image/jpeg' })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load source image'))
    img.src = src
  })
}
