import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <Sidebar collapsed={collapsed} />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200
          ${collapsed ? 'ml-[56px]' : 'ml-[220px]'}`}
      >
        <TopBar onToggle={() => setCollapsed(v => !v)} collapsed={collapsed} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 max-w-[1440px] mx-auto page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
