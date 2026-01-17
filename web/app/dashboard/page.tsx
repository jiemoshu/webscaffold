'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSubscriptions, getCurrentUser, Subscription, SubscriptionStatus, CurrentUser } from '@/lib/api'

// 状态显示名称
const statusLabels: Record<SubscriptionStatus, string> = {
  active: '生效中',
  cancelled: '已取消',
  expired: '已过期',
  past_due: '逾期',
  trialing: '试用中',
}

// 状态颜色
const statusColors: Record<SubscriptionStatus, string> = {
  active: '#10b981',
  cancelled: '#6b7280',
  expired: '#ef4444',
  past_due: '#f59e0b',
  trialing: '#3b82f6',
}

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(async (userData) => {
        setUser(userData)
        if (userData) {
          const subs = await getSubscriptions(userData.id)
          setSubscriptions(subs)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch data:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  // 获取活跃的订阅
  const activeSubscription = subscriptions.find(
    (s) => s.status === 'active' || s.status === 'trialing'
  )

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
        管理订阅
      </h1>

      {activeSubscription ? (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                订阅 #{activeSubscription.subscriptionId.slice(0, 8)}
              </h2>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: `${statusColors[activeSubscription.status]}20`,
                  color: statusColors[activeSubscription.status],
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {statusLabels[activeSubscription.status]}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              {activeSubscription.supportsAutoRenewal ? (
                <span style={{ fontSize: '12px', color: '#10b981', background: '#ecfdf5', padding: '4px 8px', borderRadius: '4px' }}>
                  自动续费
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: '#f59e0b', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px' }}>
                  手动续费
                </span>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>计划 ID</span>
                <span style={{ color: '#1f2937', fontSize: '14px', fontFamily: 'monospace' }}>
                  {activeSubscription.planId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>当前周期开始</span>
                <span style={{ color: '#1f2937', fontSize: '14px' }}>
                  {new Date(activeSubscription.currentPeriodStart).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  {activeSubscription.supportsAutoRenewal ? '下次扣费时间' : '到期时间'}
                </span>
                <span style={{ color: '#1f2937', fontSize: '14px' }}>
                  {new Date(activeSubscription.currentPeriodEnd).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          {!activeSubscription.supportsAutoRenewal && (
            <div
              style={{
                marginTop: '24px',
                padding: '12px 16px',
                background: '#fef3c7',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#92400e',
              }}
            >
              您的订阅不支持自动续费，请在到期前手动续订
            </div>
          )}
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
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            您当前没有活跃的订阅
          </p>
          <Link
            href="/subscribe"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            选择订阅计划
          </Link>
        </div>
      )}

      {/* 历史订阅列表 */}
      {subscriptions.length > 1 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            历史订阅
          </h2>
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {subscriptions
              .filter((s) => s.subscriptionId !== activeSubscription?.subscriptionId)
              .map((sub) => (
                <div
                  key={sub.subscriptionId}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '4px' }}>
                      订阅 #{sub.subscriptionId.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(sub.currentPeriodStart).toLocaleDateString('zh-CN')} -{' '}
                      {new Date(sub.currentPeriodEnd).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      background: `${statusColors[sub.status]}20`,
                      color: statusColors[sub.status],
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    {statusLabels[sub.status]}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
