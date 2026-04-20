import type { CollectionConfig } from 'payload'

import { isAdmin, ownLinkVersionsOnly, ownLinksFieldAccess, ownLinksOnly } from '@/access/links'
import { isValidHttpUrl } from '@/utils/url'
import { generateSlugIfMissing } from './hooks/generateSlug'
import { scrapeOgTagsOnCreate } from './hooks/scrapeOgTags'
import { createLinkEndpoint } from './endpoints/createLink'
import { previewLinkEndpoint } from './endpoints/previewLink'

export const Links: CollectionConfig = {
  slug: 'links',
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'targetUrl', 'owner', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: ownLinksOnly,
    delete: ownLinksOnly,
    readVersions: ownLinkVersionsOnly,
  },
  versions: {
    maxPerDoc: 50,
  },
  endpoints: [createLinkEndpoint, previewLinkEndpoint],
  hooks: {
    beforeValidate: [generateSlugIfMissing],
    beforeChange: [scrapeOgTagsOnCreate],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Auto-generated short identifier' },
      access: {
        update: ({ req }) => isAdmin(req.user),
      },
    },
    {
      name: 'targetUrl',
      type: 'text',
      required: true,
      validate: (value: unknown) =>
        isValidHttpUrl(value) || 'targetUrl must be a valid http(s) URL',
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      access: { update: () => false },
      admin: { readOnly: true },
    },
    {
      type: 'group',
      name: 'scraped',
      admin: {
        readOnly: true,
        description: 'OG metadata fetched from the target URL at creation time',
      },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'imageUrl', type: 'text' },
        { name: 'siteName', type: 'text' },
        { name: 'fetchedAt', type: 'date' },
      ],
    },
    {
      type: 'group',
      name: 'override',
      admin: {
        description: 'Optional overrides shown to crawlers when the short link is embedded',
      },
      access: {
        read: ownLinksFieldAccess,
        update: ownLinksFieldAccess,
      },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'siteName', type: 'text' },
      ],
    },
    {
      name: 'clickCount',
      type: 'number',
      defaultValue: 0,
      access: { update: () => false },
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
