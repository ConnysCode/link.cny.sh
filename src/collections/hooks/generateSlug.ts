import type { CollectionBeforeValidateHook } from 'payload'
import { customAlphabet } from 'nanoid'

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const SLUG_LENGTH = 7
const MAX_ATTEMPTS = 5

const nanoid = customAlphabet(ALPHABET, SLUG_LENGTH)

export const generateSlugIfMissing: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  if (data?.slug && typeof data.slug === 'string' && data.slug.trim().length > 0) return data

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = nanoid()
    const existing = await req.payload.find({
      collection: 'links',
      where: { slug: { equals: candidate } },
      limit: 1,
      req,
    })
    if (existing.totalDocs === 0) {
      return { ...data, slug: candidate }
    }
  }

  throw new Error('Failed to generate a unique slug after multiple attempts')
}
