/**
 * OAuth2 登录入口
 *
 * GET /api/auth/login
 *
 * 流程:
 * 1. 验证 OAuth 配置
 * 2. 生成随机 state (防 CSRF)
 * 3. 将 state 存入 session
 * 4. 302 重定向到 OAuth Provider 授权页
 */

import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import {
  generateState,
  buildAuthorizeUrl,
  validateOAuthConfig,
} from '@/lib/oauth'

export async function GET() {
  // 1. 验证 OAuth 配置
  const configCheck = validateOAuthConfig()
  if (!configCheck.valid) {
    console.error('OAuth config incomplete:', configCheck.missing)
    return NextResponse.json(
      {
        error: 'OAuth 配置不完整',
        message: `缺少配置项: ${configCheck.missing.join(', ')}`,
      },
      { status: 500 }
    )
  }

  // 2. 生成随机 state
  const state = generateState()

  // 3. 将 state 存入 session (用于 callback 时验证)
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.oauthState = state
  await session.save()

  // 4. 构建授权 URL 并重定向
  const authorizeUrl = buildAuthorizeUrl(state)

  console.log('OAuth login initiated, redirecting to:', authorizeUrl.split('?')[0])

  return NextResponse.redirect(authorizeUrl)
}
