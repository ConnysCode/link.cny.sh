import type { Access, AccessArgs, FieldAccess, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

export const isLoggedIn = (req: PayloadRequest): boolean => Boolean(req.user)

export const isAdmin = (user: PayloadRequest['user']): boolean =>
  Boolean(user && (user as { collection?: string }).collection === 'admins')

export const isFrontendUser = (user: PayloadRequest['user']): user is User =>
  Boolean(user && (user as { collection?: string }).collection === 'users')

export const hasRole = (user: PayloadRequest['user'], role: string): boolean => {
  if (!isFrontendUser(user)) return false
  const roles = (user as { roles?: unknown }).roles
  return Array.isArray(roles) && roles.includes(role)
}

export const isSpecialUser = (user: PayloadRequest['user']): boolean =>
  hasRole(user, 'special')

export const ownLinksOnly: Access = ({ req }: AccessArgs) => {
  if (isAdmin(req.user)) return true
  if (!isFrontendUser(req.user) || !req.user) return false
  return { owner: { equals: req.user.id } }
}

export const ownLinkVersionsOnly: Access = ({ req }: AccessArgs) => {
  if (isAdmin(req.user)) return true
  if (!isFrontendUser(req.user) || !req.user) return false
  return { 'version.owner': { equals: req.user.id } }
}

export const ownLinksFieldAccess: FieldAccess = ({ req, doc }) => {
  if (isAdmin(req.user)) return true
  if (!isFrontendUser(req.user) || !req.user) return false
  if (!doc) return true
  const ownerId =
    typeof doc.owner === 'object' && doc.owner !== null
      ? (doc.owner as { id: unknown }).id
      : doc.owner
  return ownerId === req.user.id
}
