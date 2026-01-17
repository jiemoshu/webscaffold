/**
 * API 工具函数 - 统一处理所有 API 请求
 *
 * NextPay API: https://pay.arbella.group
 * - POST /api/checkout/subscription - 创建订阅订单
 * - POST /api/checkout/order - 创建一次性支付订单
 * - GET /api/subscriptions?userId=<userId> - 查询用户订阅
 * - GET /api/orders?userId=<userId> - 查询用户订单
 * - GET /api/plans - 获取订阅计划列表
 */

const NEXTPAY_BASE_URL = process.env.NEXT_PUBLIC_NEXTPAY_URL || 'https://pay.arbella.group'
const NEXTPAY_API_KEY = process.env.NEXT_PUBLIC_NEXTPAY_API_KEY || ''

// 通用请求函数
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.error?.message || error.message || `Request failed: ${response.status}`)
  }

  return response.json()
}

// NextPay API 请求函数（带 Bearer Token 认证）
async function nextpayRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return request<T>(`${NEXTPAY_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(NEXTPAY_API_KEY ? { Authorization: `Bearer ${NEXTPAY_API_KEY}` } : {}),
    },
  })
}

// ========== NextPay 类型定义 ==========

// 订阅周期
export type SubscriptionPeriod = 'monthly' | 'quarterly' | 'yearly' | 'lifetime'

// 订阅计划
export interface Plan {
  id: string
  name: string
  description?: string
  prices: {
    monthly?: number
    quarterly?: number
    yearly?: number
    lifetime?: number
  }
  currency: string
}

// 创建订阅订单请求参数
export interface CreateSubscriptionParams {
  userId: string
  email: string
  name?: string
  planId: string
  period: SubscriptionPeriod
  successUrl: string
  cancelUrl: string
  amount?: number // 自定义金额（分），用于首单优惠
  discountDescription?: string
}

// 创建订阅订单响应
export interface CreateSubscriptionResponse {
  success: boolean
  data: {
    orderId: string
    paymentUrl: string
    amount: number
    plan: {
      name: string
      period: string
    }
  }
}

// 创建一次性支付订单请求参数
export interface CreateOrderParams {
  userId: string
  email: string
  name?: string
  productName: string
  productDescription?: string
  amount: number // 金额（分）
  currency?: string
  objectId?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, unknown>
}

// 创建一次性支付订单响应
export interface CreateOrderResponse {
  success: boolean
  data: {
    orderId: string
    paymentUrl: string
    amount: number
    currency: string
    productName: string
  }
}

// 订阅状态
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired'

// 订阅信息
export interface Subscription {
  subscriptionId: string
  userId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  supportsAutoRenewal: boolean
}

// 查询订阅响应
export interface GetSubscriptionsResponse {
  success: boolean
  data: Subscription[]
}

// 订单状态
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'

// 订单信息
export interface Order {
  orderId: string
  userId: string
  productName: string
  amount: number
  status: OrderStatus
  isSubscription: boolean
  createdAt: string
  paidAt?: string
}

// 查询订单响应
export interface GetOrdersResponse {
  success: boolean
  data: Order[]
}

// 获取计划列表响应
export interface GetPlansResponse {
  success: boolean
  data: Plan[]
}

// ========== NextPay API 函数 ==========

/**
 * 获取可用的订阅计划列表
 * GET /api/plans
 */
export async function getPlans(): Promise<Plan[]> {
  const response = await nextpayRequest<GetPlansResponse>('/api/plans')
  return response.data
}

/**
 * 创建订阅订单
 * POST /api/checkout/subscription
 */
export async function createSubscriptionCheckout(
  params: CreateSubscriptionParams
): Promise<CreateSubscriptionResponse['data']> {
  const response = await nextpayRequest<CreateSubscriptionResponse>('/api/checkout/subscription', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return response.data
}

/**
 * 创建一次性支付订单
 * POST /api/checkout/order
 */
export async function createOrderCheckout(
  params: CreateOrderParams
): Promise<CreateOrderResponse['data']> {
  const response = await nextpayRequest<CreateOrderResponse>('/api/checkout/order', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return response.data
}

/**
 * 查询用户订阅
 * GET /api/subscriptions?userId=<userId>
 */
export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  const response = await nextpayRequest<GetSubscriptionsResponse>(
    `/api/subscriptions?userId=${encodeURIComponent(userId)}`
  )
  return response.data
}

/**
 * 查询用户订单
 * GET /api/orders?userId=<userId>
 */
export async function getOrders(userId: string): Promise<Order[]> {
  const response = await nextpayRequest<GetOrdersResponse>(
    `/api/orders?userId=${encodeURIComponent(userId)}`
  )
  return response.data
}

// ========== 用户认证 API ==========

export interface CurrentUser {
  id: string
  name: string
  email: string
  avatar?: string
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const data = await request<{ user: CurrentUser }>('/api/auth/me')
    return data.user
  } catch {
    return null
  }
}
