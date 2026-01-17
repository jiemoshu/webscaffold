/**
 * Next.js Middleware - 路由保护
 *
 * 默认所有页面公开，只有 PROTECTED_ROUTES 中的页面需要登录
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

// 需要登录的路由
const PROTECTED_ROUTES = ['/dashboard', '/subscribe']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否为受保护路由
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  // 非受保护路由直接放行
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // 获取 session
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)
  const isLoggedIn = !!session.user

  // 未登录用户访问受保护页面 -> 直接跳转 OAuth 登录
  if (!isLoggedIn) {
    const loginUrl = new URL('/api/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

// 只匹配需要保护的路由
export const config = {
  matcher: ['/dashboard/:path*', '/subscribe/:path*'],
}
