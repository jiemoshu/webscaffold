import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, background: '#f5f5f5' }}>{children}</main>
      <Footer />
    </div>
  )
}
