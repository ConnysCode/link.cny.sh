import { NextResponse, type NextRequest } from 'next/server'

const REDIRECT_HOST = process.env.NEXT_PUBLIC_REDIRECT_HOST ?? 'l.cny.sh'

export function proxy(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0]?.toLowerCase()
  const { pathname } = req.nextUrl

  if (host !== REDIRECT_HOST.toLowerCase()) return NextResponse.next()

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/r/') ||
    pathname.startsWith('/_next')
  ) {
    return new NextResponse(null, { status: 404 })
  }

  if (pathname === '/' || pathname === '/favicon.ico') return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = `/r${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
