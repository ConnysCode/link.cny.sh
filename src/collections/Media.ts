import type { CollectionConfig } from 'payload'

import { isLoggedIn } from '@/access/links'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req }) => isLoggedIn(req),
    update: ({ req }) => isLoggedIn(req),
    delete: ({ req }) => isLoggedIn(req),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'og', width: 1200, height: 630, fit: 'cover' },
    ],
  },
}
