/**
 * OAuth2 回调处理
 *
 * GET /api/auth/callback?code=xxx&state=xxx
 *
 * 流程:
 * 1. 验证 state (防 CSRF)
 * 2. 用 code 换 access_token
 * 3. 用 token 获取 userinfo
 * 4. 查找或创建本地用户
 * 5. 写入 session
 * 6. 重定向到首页
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData, SessionUser } from '@/lib/session'
import {
  exchangeCodeForToken,
  fetchUserInfo,
  normalizeUserInfo,
} from '@/lib/oauth'

// 错误页面 URL
const ERROR_URL = '/login?error='

// 首页 URL
const SUCCESS_URL = '/'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 0. Provider 返回错误
  if (error) {
    console.error('OAuth error from provider:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`${ERROR_URL}${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  // 1. 验证必要参数
  if (!code || !state) {
    console.error('Missing code or state in callback')
    return NextResponse.redirect(
      new URL(`${ERROR_URL}${encodeURIComponent('缺少授权码或状态参数')}`, request.url)
    )
  }

  // 2. 验证 state (防 CSRF)
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const savedState = session.oauthState

  if (!savedState || savedState !== state) {
    console.error('State mismatch:', { savedState, receivedState: state })
    // 清除旧 state
    session.oauthState = undefined
    await session.save()
    return NextResponse.redirect(
      new URL(`${ERROR_URL}${encodeURIComponent('状态验证失败，请重新登录')}`, request.url)
    )
  }

  // 清除已使用的 state (防止重放攻击)
  session.oauthState = undefined

  try {
    // 3. 用 code 换 access_token
    console.log('Exchanging code for token...')
    const tokenResponse = await exchangeCodeForToken(code)

    // 4. 用 token 获取 userinfo
    console.log('Fetching user info...')
    const rawUserInfo = await fetchUserInfo(tokenResponse.access_token)
    const userInfo = normalizeUserInfo(rawUserInfo)

    if (!userInfo.providerUserId) {
      throw new Error('Provider did not return user ID')
    }

    // 5. 查找或创建本地用户
    console.log('Finding or creating local user for:', userInfo.providerUserId)
    const localUser = await findOrCreateUser(userInfo)

    // 6. 写入 session
    session.user = localUser
    await session.save()

    console.log('OAuth login successful for user:', localUser.id)

    // 7. 重定向到首页
    return NextResponse.redirect(new URL(SUCCESS_URL, request.url))
  } catch (err) {
    console.error('OAuth callback error:', err)
    const message = err instanceof Error ? err.message : '登录过程发生错误'
    return NextResponse.redirect(
      new URL(`${ERROR_URL}${encodeURIComponent(message)}`, request.url)
    )
  }
}

/**
 * 查找或创建本地用户
 *
 * 策略:
 * - 如果 providerUserId 已存在，返回现有用户
 * - 如果不存在，创建新用户
 */
async function findOrCreateUser(userInfo: {
  providerUserId: string
  name: string
  email: string
  avatar?: string
}): Promise<SessionUser> {
  // 使用本地 Next.js API routes 作为代理
  // 这些 API routes 会转发请求到 Lambda API Gateway
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    // 尝试通过 providerUserId 查找用户
    const searchResponse = await fetch(
      `${baseUrl}/api/users/by-provider/${encodeURIComponent(userInfo.providerUserId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (searchResponse.ok) {
      // 用户已存在
      const existingUser = await searchResponse.json()
      console.log('Found existing user:', existingUser.id)
      return {
        id: existingUser.id,
        providerUserId: existingUser.providerUserId,
        name: existingUser.name,
        email: existingUser.email,
        avatar: existingUser.avatar,
      }
    }

    if (searchResponse.status !== 404) {
      // 非 404 错误
      throw new Error(`User search failed: ${searchResponse.status}`)
    }

    // 用户不存在，创建新用户
    console.log('Creating new user for provider ID:', userInfo.providerUserId)
    const createResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerUserId: userInfo.providerUserId,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      throw new Error(`User creation failed: ${createResponse.status} - ${errorText}`)
    }

    const newUser = await createResponse.json()
    console.log('Created new user:', newUser.id)

    return {
      id: newUser.id,
      providerUserId: newUser.providerUserId,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
    }
  } catch (err) {
    console.error('Error in findOrCreateUser:', err)
    throw err
  }
}
