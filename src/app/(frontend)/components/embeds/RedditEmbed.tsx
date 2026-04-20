'use client'

import { EditableText } from './EditableText'
import { EditableImage } from './EditableImage'
import { hostFromUrl, type EmbedProps } from './types'

export function RedditEmbed({ targetUrl, tags, editable, onTextChange, onImageClick }: EmbedProps) {
  const host = hostFromUrl(targetUrl)
  return (
    <article className="embed embed-reddit">
      <div className="embed-reddit-card">
        <div className="embed-reddit-media">
          <EditableImage src={tags.imageUrl} editable={editable} onClick={onImageClick} />
          <div className="embed-reddit-domain-pill">
            <span>{host || 'example.com'}</span>
            <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
              <path
                d="M3 1h7v7h-1.5V3.56L2.56 9.5 1.5 8.44 7.44 2.5H3V1z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        <div className="embed-reddit-meta">
          <EditableText
            as="div"
            className="embed-reddit-title"
            value={tags.title}
            placeholder="Post title"
            editable={editable}
            onChange={(v) => onTextChange?.('title', v)}
            fallback={<div className="embed-reddit-title placeholder">Untitled</div>}
          />
          <EditableText
            as="div"
            className="embed-reddit-description"
            value={tags.description}
            placeholder="Description"
            editable={editable}
            onChange={(v) => onTextChange?.('description', v)}
            multiline
          />
        </div>
      </div>
    </article>
  )
}
