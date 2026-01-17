/**
 * 用户 API 代理
 *
 * POST /api/users - 创建用户
 * GET /api/users - 获取所有用户 (需要已登录)
 *
 * 这是一个代理层，将请求转发到 AWS Lambda API Gateway
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

// Lambda API Gateway URL
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || process.env.NEXT_PUBLIC_API_ENDPOINT || ''

/**
 * POST /api/users - 创建新用户
 * 用于 OAuth callback 创建用户，无需登录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 如果配置了 API Gateway，转发请求
    if (API_GATEWAY_URL) {
      const response = await fetch(`${API_GATEWAY_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    // 本地开发模式: 直接操作内存存储 (仅用于测试)
    // 生产环境应该配置 API_GATEWAY_URL
    const user = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 注意: 这只是演示用途，实际应该连接到数据库
    console.warn('Local dev mode: created user in memory (not persisted)')
    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error('Create user error:', err)
    return NextResponse.json(
      { error: '创建用户失败', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/users - 获取所有用户
 * 需要已登录
 */
export async function GET() {
  // 检查登录状态
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    if (API_GATEWAY_URL) {
      const response = await fetch(`${API_GATEWAY_URL}/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    // 本地开发模式返回空数组
    return NextResponse.json([])
  } catch (err) {
    console.error('Get users error:', err)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}
