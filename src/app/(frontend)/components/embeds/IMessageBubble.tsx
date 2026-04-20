'use client'

import { EditableText } from './EditableText'
import { EditableImage } from './EditableImage'
import { hostFromUrl, type EmbedProps } from './types'

export function IMessageBubble({ targetUrl, tags, editable, onTextChange, onImageClick }: EmbedProps) {
  const host = hostFromUrl(targetUrl)
  return (
    <article className="embed embed-imessage">
      <div className="embed-imessage-bubble">
        <EditableImage src={tags.imageUrl} editable={editable} onClick={onImageClick} aspect="16/9" />
        <div className="embed-imessage-meta">
          <EditableText
            as="div"
            className="embed-imessage-title"
            value={tags.title}
            placeholder="Title"
            editable={editable}
            onChange={(v) => onTextChange?.('title', v)}
            fallback={<div className="embed-imessage-title placeholder">Untitled</div>}
          />
          <EditableText
            as="div"
            className="embed-imessage-description"
            value={tags.description}
            placeholder="Description"
            editable={editable}
            onChange={(v) => onTextChange?.('description', v)}
            multiline
          />
          <div className="embed-imessage-host">{host || 'example.com'}</div>
        </div>
      </div>
    </article>
  )
}
