/**
 * 登出处理
 *
 * GET /api/auth/logout
 * POST /api/auth/logout
 *
 * 流程:
 * 1. 销毁 session
 * 2. 重定向到登录页
 */

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

async function handleLogout() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  // 销毁 session
  session.destroy()

  console.log('User logged out')

  // 重定向到登录页
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}

// 支持 GET 和 POST 请求
export const GET = handleLogout
export const POST = handleLogout
