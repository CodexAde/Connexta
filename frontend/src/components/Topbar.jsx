import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChannel } from '../context/ChannelContext'
import Avatar from './Avatar'

function Topbar() {
  const { user, logout } = useAuth()
  const { currentChannel } = useChannel()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
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
    <header className="h-16 border-b border-white/5 bg-bg-secondary px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="btn-ghost">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <button className="btn-ghost">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div className="relative group">
          <button className="flex items-center gap-2">
            <Avatar user={user} size="sm" />
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="glass rounded-xl p-2 shadow-xl">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
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
