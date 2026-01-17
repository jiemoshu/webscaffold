'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { href: '/dashboard', label: '管理订阅' },
  { href: '/dashboard/orders', label: '历史订单' },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '24px 0',
        minHeight: 'calc(100vh - 130px)',
      }}
    >
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '12px 24px',
                    color: isActive ? '#667eea' : '#374151',
                    background: isActive ? '#f0f4ff' : 'transparent',
                    borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '400',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
