import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url))
  res.cookies.set('payload-token', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
