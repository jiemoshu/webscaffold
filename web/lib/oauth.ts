/**
 * OAuth2 Provider 集成工具
 *
 * 实现 Authorization Code Flow:
 * 1. 生成授权 URL (带 state 防 CSRF)
 * 2. 用 code 换 access_token
 * 3. 用 token 获取 userinfo
 */

// OAuth2 配置 - 从环境变量读取
export const oauthConfig = {
  clientId: process.env.OAUTH_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
  authorizeUrl: process.env.OAUTH_AUTHORIZE_URL || '',
  tokenUrl: process.env.OAUTH_TOKEN_URL || '',
  userinfoUrl: process.env.OAUTH_USERINFO_URL || '',
  redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  scope: process.env.OAUTH_SCOPE || 'openid profile email',
}

// Userinfo 响应类型 (标准 OIDC claims)
export interface OAuthUserInfo {
  sub: string           // Provider 用户唯一标识
  name?: string
  email?: string
  picture?: string
  // 支持常见的非标准字段
  id?: string           // 部分 Provider 使用 id 而非 sub
  login?: string        // GitHub 风格
  avatar_url?: string   // GitHub 风格
  nickname?: string     // 部分 Provider 使用
}

// Token 响应类型
export interface OAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
}

/**
 * 生成随机 state 字符串，用于防止 CSRF 攻击
 */
export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 构建 OAuth2 授权 URL
 */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    scope: oauthConfig.scope,
    state: state,
  })

  return `${oauthConfig.authorizeUrl}?${params.toString()}`
}

/**
 * 用授权码换取 access_token
 *
 * POST {tokenUrl}
 * Content-Type: application/x-www-form-urlencoded
 * Body: grant_type, code, redirect_uri, client_id, client_secret
 */
export async function exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: oauthConfig.redirectUri,
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
  })

  const response = await fetch(oauthConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Token exchange failed:', response.status, errorText)
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  return response.json()
}

/**
 * 使用 access_token 获取用户信息
 *
 * GET {userinfoUrl}
 * Authorization: Bearer {access_token}
 */
export async function fetchUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch(oauthConfig.userinfoUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Userinfo fetch failed:', response.status, errorText)
    throw new Error(`Userinfo fetch failed: ${response.status}`)
  }

  return response.json()
}

/**
 * 从 userinfo 中提取标准化的用户数据
 * 兼容不同 Provider 的字段命名差异
 */
export function normalizeUserInfo(info: OAuthUserInfo): {
  providerUserId: string
  name: string
  email: string
  avatar?: string
} {
  return {
    // 优先使用 sub，回退到 id
    providerUserId: info.sub || info.id || '',
    // 优先使用 name，回退到 nickname/login
    name: info.name || info.nickname || info.login || 'Unknown',
    // email 可能为空
    email: info.email || '',
    // 头像字段兼容
    avatar: info.picture || info.avatar_url,
  }
}

/**
 * 验证 OAuth 配置是否完整
 */
export function validateOAuthConfig(): { valid: boolean; missing: string[] } {
  const required = [
    'clientId',
    'clientSecret',
    'authorizeUrl',
    'tokenUrl',
    'userinfoUrl',
  ] as const

  const missing = required.filter((key) => !oauthConfig[key])

  return {
    valid: missing.length === 0,
    missing,
  }
}
