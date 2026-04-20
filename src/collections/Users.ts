import type { CollectionConfig } from 'payload'

const isAdmin = (user: unknown): boolean =>
  Boolean(user && (user as { collection?: string }).collection === 'admins')

const isSelfOrAdmin = (
  user: unknown,
): true | { id: { equals: string | number } } => {
  if (isAdmin(user)) return true
  const u = user as { collection?: string; id?: string | number } | null
  if (u?.collection === 'users' && u.id != null) return { id: { equals: u.id } }
  return { id: { equals: '__never__' } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    description: 'Frontend users — log in via link.cny.sh, no admin panel access',
    hidden: ({ user }) => !isAdmin(user),
  },
  auth: true,
  access: {
    create: () => true,
    read: ({ req }) => isSelfOrAdmin(req.user),
    update: ({ req }) => isSelfOrAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
    admin: () => false,
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [{ label: 'Special — may set custom slugs', value: 'special' }],
      saveToJWT: true,
      admin: {
        description: 'Optional capabilities granted by an administrator',
      },
      access: {
        create: ({ req }) => isAdmin(req.user),
        update: ({ req }) => isAdmin(req.user),
      },
    },
  ],
}
