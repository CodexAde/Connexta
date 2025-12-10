import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import IncomingCallModal from '../components/IncomingCallModal'
import { useCall } from '../context/CallContext'
import { Menu } from 'lucide-react'

function DashboardLayout() {
  const { incomingCall } = useCall()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle dynamic viewport height for mobile keyboard
  return (
    <div className="flex h-[100dvh] bg-black overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar-mobile ${sidebarOpen ? '' : 'closed'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-black">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-white">Connexta</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        
        {/* Desktop topbar */}
        <div className="hidden md:block">
          <Topbar />
        </div>
        
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      {/* Incoming call modal - show inside dashboard */}
      {incomingCall && <IncomingCallModal />}
    </div>
  )
}

export default DashboardLayout
