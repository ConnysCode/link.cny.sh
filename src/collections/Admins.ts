import type { CollectionConfig } from 'payload'

const isAdmin = (user: unknown): boolean =>
  Boolean(user && (user as { collection?: string }).collection === 'admins')

export const Admins: CollectionConfig = {
  slug: 'admins',
  admin: {
    useAsTitle: 'email',
    description: 'Backoffice users who can access the Payload admin panel',
  },
  auth: true,
  access: {
    create: ({ req }) => isAdmin(req.user),
    read: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
    admin: ({ req }) => isAdmin(req.user),
  },
  fields: [],
}
