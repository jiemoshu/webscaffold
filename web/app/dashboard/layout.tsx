import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DashboardSidebar from '@/components/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1 }}>
        <DashboardSidebar />
        <main style={{ flex: 1, padding: '24px', background: '#f5f5f5' }}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
