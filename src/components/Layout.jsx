import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import useAuthStore from '../store/authStore'
import useSyllabusStore from '../store/syllabusStore'
import { getSyllabus } from '../api/syllabus'

const SIDEBAR_WIDTH = 272

const Layout = () => {
  const user = useAuthStore((s) => s.user)
  const { setTopics, loaded } = useSyllabusStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  /* ── Detect mobile ── */
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* ── Fetch syllabus on mount ── */
  useEffect(() => {
    const exams = ['APPSC Group 1', 'APPSC Group 2']
    if (!loaded) {
      exams.forEach((exam) => {
        getSyllabus(exam)
          .then((data) => setTopics(exam, data))
          .catch(() => { /* non-critical */ })
      })
    }
  }, [loaded, setTopics])

  const effectiveWidth = sidebarOpen && !isMobile ? SIDEBAR_WIDTH : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main area */}
      <div
        className="flex flex-col min-h-screen"
        style={{
          marginLeft: effectiveWidth,
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Topbar
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((o) => !o)}
        />

        <main
          style={{
            flex: 1,
            padding: '36px 40px 60px',
            maxWidth: 1220,
            width: '100%',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
