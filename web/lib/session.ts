/**
 * Session 配置 - 使用 iron-session 管理加密的 HTTP-only Cookie
 *
 * 安全特性:
 * - HTTP-only: 防止 XSS 攻击
 * - Secure: 生产环境仅通过 HTTPS 传输
 * - SameSite: 防止 CSRF 攻击
 * - 加密存储: 使用 SESSION_SECRET 加密 session 数据
 */

import { SessionOptions } from 'iron-session'

// Session 中存储的用户数据类型
export interface SessionUser {
  id: string
  providerUserId: string
  name: string
  email: string
  avatar?: string
}

// Session 数据结构
export interface SessionData {
  user?: SessionUser
  // OAuth state 用于防止 CSRF 攻击
  oauthState?: string
}

// iron-session 配置
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'singapore-math-session',
  cookieOptions: {
    // 生产环境使用 secure cookie
    secure: process.env.NODE_ENV === 'production',
    // SameSite=Lax 允许 OAuth 回调时携带 cookie
    sameSite: 'lax',
    // Session 过期时间: 7 天
    maxAge: 60 * 60 * 24 * 7,
    // 仅限当前域名
    path: '/',
  },
}

// 类型声明扩展
declare module 'iron-session' {
  interface IronSessionData extends SessionData {}
}
