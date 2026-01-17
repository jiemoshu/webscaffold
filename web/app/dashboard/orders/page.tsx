'use client'

import { useEffect, useState } from 'react'
import { getOrders, getCurrentUser, Order, OrderStatus, CurrentUser } from '@/lib/api'

// 状态显示名称
const statusLabels: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  failed: '失败',
  cancelled: '已取消',
  refunded: '已退款',
}

// 状态颜色
const statusColors: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  paid: '#10b981',
  failed: '#ef4444',
  cancelled: '#6b7280',
  refunded: '#8b5cf6',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(async (userData) => {
        setUser(userData)
        if (userData) {
          const orderList = await getOrders(userData.id)
          setOrders(orderList)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch orders:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  // 格式化金额（分转元）
  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
        历史订单
      </h1>

      {orders.length > 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                  订单号
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                  商品
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                  金额
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                  类型
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                  状态
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                    <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                      {order.orderId.slice(0, 12)}...
                    </code>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                    {order.productName}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                    {formatAmount(order.amount)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: order.isSubscription ? '#dbeafe' : '#f3f4f6',
                        color: order.isSubscription ? '#1d4ed8' : '#4b5563',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {order.isSubscription ? '订阅' : '一次性'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: `${statusColors[order.status]}20`,
                        color: statusColors[order.status],
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <p style={{ color: '#6b7280' }}>暂无订单记录</p>
        </div>
      )}
    </div>
  )
}
