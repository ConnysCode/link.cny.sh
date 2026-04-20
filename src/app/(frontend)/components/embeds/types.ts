export type EmbedTags = {
  title: string
  description: string
  imageUrl: string | null
  siteName: string
}

export type EmbedProps = {
  targetUrl: string
  tags: EmbedTags
  editable: boolean
  onTextChange?: (field: 'title' | 'description' | 'siteName', value: string) => void
  onImageClick?: () => void
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
