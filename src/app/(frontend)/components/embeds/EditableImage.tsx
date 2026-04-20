'use client'

type Props = {
  src: string | null
  editable: boolean
  onClick?: () => void
  alt?: string
  aspect?: '16/9' | '1/1' | '4/3'
  className?: string
}

export function EditableImage({ src, editable, onClick, alt = '', aspect = '16/9', className }: Props) {
  const cls = `embed-image aspect-${aspect.replace('/', '-')} ${className ?? ''}`.trim()

  return (
    <div
      className={cls}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : -1}
      onClick={editable ? onClick : undefined}
      onKeyDown={
        editable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} />
      ) : (
        <div className="embed-image-placeholder">
          {editable ? 'Click to upload image' : 'No image'}
        </div>
      )}
      {editable && src && <div className="embed-image-overlay">Click to change</div>}
    </div>
  )
}
