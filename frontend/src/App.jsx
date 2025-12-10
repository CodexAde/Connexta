import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './pages/DashboardLayout'
import ChannelPage from './pages/ChannelPage'
import DMsPage from './pages/DMsPage'
import CallRoomPage from './pages/CallRoomPage'
import VideoCallPage from './pages/VideoCallPage'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/app" replace />
  }
  
  return children
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Landing page as the main entry point */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/welcome" element={<LandingPage />} />
      
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      
      {/* Video call page - full screen, outside dashboard layout */}
      <Route path="/call/:callId" element={
        <ProtectedRoute>
          <VideoCallPage />
        </ProtectedRoute>
      } />
      <Route path="/call" element={
        <ProtectedRoute>
          <VideoCallPage />
        </ProtectedRoute>
      } />
      
      <Route path="/app" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/app/channels/general" replace />} />
        <Route path="channels/:channelId" element={<ChannelPage />} />
        <Route path="dm" element={<DMsPage />} />
        <Route path="dm/:userId" element={<DMsPage />} />
        <Route path="calls" element={<CallRoomPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
    </>
  )
}

export default App
