'use client'

import { createElement, useEffect, useRef, type ReactNode } from 'react'

type Props = {
  value: string
  placeholder?: string
  editable: boolean
  multiline?: boolean
  className?: string
  onChange?: (value: string) => void
  as?: 'span' | 'div' | 'p' | 'h3' | 'h4'
  fallback?: ReactNode
}

export function EditableText({
  value,
  placeholder = '',
  editable,
  multiline = false,
  className,
  onChange,
  as = 'span',
  fallback = null,
}: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!editable) return
    const el = ref.current
    if (!el) return
    if (el.textContent !== value) el.textContent = value
  }, [value, editable])

  if (!editable) {
    if (!value) return <>{fallback}</>
    return createElement(as, { className }, value)
  }

  return createElement(as, {
    ref,
    className: `${className ?? ''} editable ${value ? '' : 'editable-empty'}`.trim(),
    contentEditable: true,
    suppressContentEditableWarning: true,
    'data-placeholder': placeholder,
    onInput: (e: React.FormEvent<HTMLElement>) => {
      const text = (e.currentTarget as HTMLElement).innerText
      onChange?.(multiline ? text : text.replace(/\n/g, ' '))
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === 'Enter') e.preventDefault()
    },
  })
}
