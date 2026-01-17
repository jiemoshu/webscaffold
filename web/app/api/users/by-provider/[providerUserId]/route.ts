/**
 * 通过 OAuth Provider ID 获取用户
 *
 * GET /api/users/by-provider/{providerUserId}
 *
 * 用于 OAuth callback 查找已存在的用户，无需登录
 */

import { NextRequest, NextResponse } from 'next/server'

// Lambda API Gateway URL
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || process.env.NEXT_PUBLIC_API_ENDPOINT || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerUserId: string }> }
) {
  const { providerUserId } = await params

  if (!providerUserId) {
    return NextResponse.json(
      { error: '缺少参数', message: '请提供 providerUserId' },
      { status: 400 }
    )
  }

  try {
    if (API_GATEWAY_URL) {
      const response = await fetch(
        `${API_GATEWAY_URL}/users/by-provider/${encodeURIComponent(providerUserId)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    // 本地开发模式: 总是返回 404，强制创建新用户
    return NextResponse.json(
      { error: '用户不存在', message: `未找到 Provider ID 为 ${providerUserId} 的用户` },
      { status: 404 }
    )
  } catch (err) {
    console.error('Get user by provider ID error:', err)
    return NextResponse.json(
      { error: '查找用户失败', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
