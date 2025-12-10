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
  // Handle dynamic viewport height for mobile keyboard
  // Formula: keyboardHeight = initialViewportHeight - currentVisualViewportHeight
  // We use this to set the app height to the *visible* area, effectively shrinking it above the keyboard.
  useEffect(() => {
    // Store initial height
    const getViewportHeight = () => {
      return window.visualViewport ? window.visualViewport.height : window.innerHeight
    }
    
    let initialHeight = getViewportHeight()

    const handleResize = () => {
      const currentHeight = getViewportHeight()
      
      // Calculate keyboard height (for debugging or potential future use)
      const keyboardHeight = initialHeight - currentHeight
      
      // If significant difference (keyboard open), or even if just resizing, update height
      // We check if it's smaller, effectively.
      // But actually, we just want the app to always fill the visible area on mobile.
      document.documentElement.style.setProperty('--app-height', `${currentHeight}px`)

      // If we are back to near initial height, ensure we reset to 100dvh equivalent or initial
      if (Math.abs(keyboardHeight) < 50) {
         // Keyboard likely closed
         // Optionally reset or keep updating. Updating is safer.
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      window.visualViewport.addEventListener('scroll', handleResize)
    } else {
      window.addEventListener('resize', handleResize)
    }

    handleResize() // Initial set

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
        window.visualViewport.removeEventListener('scroll', handleResize)
      } else {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return (
    <div className="flex h-[100dvh] md:h-screen bg-black overflow-hidden" style={{ height: 'var(--app-height, 100dvh)' }}>
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
