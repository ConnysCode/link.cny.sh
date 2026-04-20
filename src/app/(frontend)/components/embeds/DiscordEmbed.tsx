'use client'

import { EditableText } from './EditableText'
import { EditableImage } from './EditableImage'
import { hostFromUrl, type EmbedProps } from './types'

export function DiscordEmbed({ targetUrl, tags, editable, onTextChange, onImageClick }: EmbedProps) {
  const host = hostFromUrl(targetUrl)
  return (
    <article className="embed embed-discord">
      <div className="embed-discord-card">
        <div className="embed-discord-bar" />
        <div className="embed-discord-body">
          <EditableText
            as="div"
            className="embed-discord-site"
            value={tags.siteName}
            placeholder={host || 'Site name'}
            editable={editable}
            onChange={(v) => onTextChange?.('siteName', v)}
            fallback={<div className="embed-discord-site placeholder">{host}</div>}
          />
          <EditableText
            as="div"
            className="embed-discord-title"
            value={tags.title}
            placeholder="Title"
            editable={editable}
            onChange={(v) => onTextChange?.('title', v)}
            fallback={<div className="embed-discord-title placeholder">Untitled</div>}
          />
          <EditableText
            as="div"
            className="embed-discord-description"
            value={tags.description}
            placeholder="Description"
            editable={editable}
            onChange={(v) => onTextChange?.('description', v)}
            multiline
          />
          <div className="embed-discord-image-wrap">
            <EditableImage src={tags.imageUrl} editable={editable} onClick={onImageClick} />
          </div>
        </div>
      </div>
    </article>
  )
}
