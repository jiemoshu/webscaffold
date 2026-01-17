/**
 * 获取当前登录用户信息
 *
 * GET /api/auth/me
 *
 * 响应:
 * - 200: { user: SessionUser }
 * - 401: { error: '未登录' }
 */

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.user) {
    return NextResponse.json(
      { error: '未登录' },
      { status: 401 }
    )
  }

  return NextResponse.json({ user: session.user })
}
