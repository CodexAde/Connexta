import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import CallPanel from '../components/CallPanel'
import IncomingCallModal from '../components/IncomingCallModal'
import { useCall } from '../context/CallContext'

function DashboardLayout() {
  const { inCall, incomingCall } = useCall()

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {inCall && <CallPanel />}
      {incomingCall && <IncomingCallModal />}
    </div>
  )
}

export default DashboardLayout
