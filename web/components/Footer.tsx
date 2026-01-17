'use client'

import Link from 'next/link'

export default function Footer() {
  const commitHash = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || 'dev'

  return (
    <footer
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        color: '#6b7280',
        fontSize: '13px',
      }}
    >
      <p style={{ margin: 0 }}>
        &copy; {new Date().getFullYear()} Singapore Math
      </p>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link
          href="/tools/graphing-calculator"
          style={{
            color: '#6b7280',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#667eea')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
        >
          Graphing Calculator
        </Link>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          v.{commitHash}
        </span>
      </div>
    </footer>
  )
}
