'use client'

import { useEffect, useState } from 'react'
import {
  getPlans,
  createSubscriptionCheckout,
  getCurrentUser,
  Plan,
  CurrentUser,
  SubscriptionPeriod,
} from '@/lib/api'

// 周期显示名称
const periodLabels: Record<SubscriptionPeriod, string> = {
  monthly: '月',
  quarterly: '季',
  yearly: '年',
  lifetime: '永久',
}

export default function SubscribePage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPlans(), getCurrentUser()])
      .then(([plansData, userData]) => {
        setPlans(plansData)
        setUser(userData)
      })
      .catch((error) => {
        console.error('Failed to fetch data:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (plan: Plan, period: SubscriptionPeriod) => {
    if (!user) {
      alert('请先登录')
      return
    }

    const key = `${plan.id}-${period}`
    setSubscribing(key)
    try {
      const result = await createSubscriptionCheckout({
        userId: user.id,
        email: user.email,
        name: user.name,
        planId: plan.id,
        period,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/subscribe?payment=canceled`,
      })

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }
    } catch (error) {
      console.error('Failed to create checkout:', error)
      alert('创建支付会话失败，请稍后重试')
    } finally {
      setSubscribing(null)
    }
  }

  // 格式化金额（分转元）
  const formatAmount = (cents: number, currency: string) => {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', color: '#666' }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>
          选择订阅计划
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          选择适合您的计划，开始学习之旅
        </p>
      </div>

      {plans.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            justifyContent: 'center',
          }}
        >
          {plans.map((plan) => {
            // 获取可用的价格周期
            const availablePeriods = (
              Object.entries(plan.prices) as [SubscriptionPeriod, number | undefined][]
            ).filter(([, price]) => price !== undefined) as [SubscriptionPeriod, number][]

            return (
              <div
                key={plan.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  {plan.name}
                </h2>

                {plan.description && (
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '24px',
                      lineHeight: '1.5',
                    }}
                  >
                    {plan.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                  {availablePeriods.map(([period, price]) => {
                    const key = `${plan.id}-${period}`
                    return (
                      <div
                        key={period}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                            {formatAmount(price, plan.currency)}
                          </span>
                          <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '4px' }}>
                            / {periodLabels[period]}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSubscribe(plan, period)}
                          disabled={subscribing !== null}
                          style={{
                            padding: '8px 20px',
                            background:
                              subscribing === key
                                ? '#9ca3af'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: subscribing !== null ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {subscribing === key ? '处理中...' : '订阅'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '48px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#6b7280' }}>暂无可用的订阅计划</p>
        </div>
      )}
    </div>
  )
}
