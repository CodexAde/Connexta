import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChannel } from '../context/ChannelContext'
import Avatar from './Avatar'
import { Search, Bell, LogOut, Settings, ChevronDown } from 'lucide-react'

function Topbar() {
  const { user, logout } = useAuth()
  const { currentChannel } = useChannel()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getTitle = () => {
    if (!currentChannel) return 'Connexta'
    if (currentChannel.type === 'dm') {
      const otherUser = currentChannel.members?.find(m => m._id !== user?._id)
      return otherUser?.name || 'Direct Message'
    }
    return currentChannel.name || 'Channel'
  }

  return (
    <header className="h-14 border-b border-white/[0.05] bg-black px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-white">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-ghost p-2">
          <Search className="w-5 h-5" />
        </button>

        <button className="btn-ghost p-2">
          <Bell className="w-5 h-5" />
        </button>

        <div className="relative group">
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
            <Avatar user={user} size="sm" />
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          <div className="absolute right-0 top-full mt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="glass rounded-xl p-2 shadow-xl">
              <div className="px-3 py-2 border-b border-white/[0.05] mb-1">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar
