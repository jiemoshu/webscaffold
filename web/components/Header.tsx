'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser, CurrentUser } from '@/lib/api'

export default function Header() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
          textDecoration: 'none',
        }}
      >
        Singapore Math
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {loading ? (
          <span style={{ color: '#666', fontSize: '14px' }}>...</span>
        ) : user ? (
          <>
            <Link
              href="/dashboard"
              style={{
                padding: '8px 16px',
                color: '#374151',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/subscribe"
              style={{
                padding: '8px 16px',
                color: '#374151',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              订阅
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '14px', color: '#374151' }}>{user.name}</span>
              <a
                href="/api/auth/logout"
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                退出
              </a>
            </div>
          </>
        ) : (
          <Link
            href="/login"
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            登录
          </Link>
        )}
      </nav>
    </header>
  )
}
