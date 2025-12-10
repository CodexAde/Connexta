import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChannel } from '../context/ChannelContext'
import Avatar from './Avatar'
import { Home, MessageSquare, Phone, Hash, X, LogOut } from 'lucide-react'

function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const { channels, dmChannels } = useChannel()
  const navigate = useNavigate()

  const defaultChannels = channels.filter(c => c.isDefault)
  const customChannels = channels.filter(c => !c.isDefault)

  const getOtherUser = (channel) => {
    return channel.members?.find(m => m._id !== user?._id)
  }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="w-64 md:w-64 bg-black border-r border-white/[0.05] flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
            <span className="text-black font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Connexta</h1>
            <p className="text-xs text-gray-600">Team Chat</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-6">
          <NavLink
            to="/app"
            end
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/app/dm"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <MessageSquare className="w-5 h-5" />
            <span>Direct Messages</span>
          </NavLink>

          <NavLink
            to="/app/calls"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <Phone className="w-5 h-5" />
            <span>Calls</span>
          </NavLink>
        </div>

        {/* Channels */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">
            Channels
          </h3>
          <div className="space-y-0.5">
            {defaultChannels.map(channel => (
              <NavLink
                key={channel._id}
                to={`/app/channels/${channel.slug}`}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `channel-item ${isActive ? 'channel-item-active' : ''}`
                }
              >
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="truncate">{channel.name?.replace('#', '')}</span>
              </NavLink>
            ))}
            {customChannels.map(channel => (
              <NavLink
                key={channel._id}
                to={`/app/channels/${channel._id}`}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `channel-item ${isActive ? 'channel-item-active' : ''}`
                }
              >
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="truncate">{channel.name?.replace('#', '')}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        {dmChannels.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">
              Direct Messages
            </h3>
            <div className="space-y-0.5">
              {dmChannels.slice(0, 5).map(channel => {
                const otherUser = getOtherUser(channel)
                if (!otherUser) return null
                
                return (
                  <NavLink
                    key={channel._id}
                    to={`/app/dm/${otherUser._id}`}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `channel-item ${isActive ? 'channel-item-active' : ''}`
                    }
                  >
                    <Avatar user={otherUser} size="xs" />
                    <span className="truncate">{otherUser.name}</span>
                  </NavLink>
                )
              })}
              {dmChannels.length > 5 && (
                <button
                  onClick={() => {
                    navigate('/app/dm')
                    handleNavClick()
                  }}
                  className="channel-item w-full text-left"
                >
                  <span className="text-gray-500 text-sm">+{dmChannels.length - 5} more</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-600 truncate">{user?.department}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-gray-500 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
