import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChannel } from '../context/ChannelContext'
import Avatar from './Avatar'

function Sidebar() {
  const { user } = useAuth()
  const { channels, dmChannels } = useChannel()
  const navigate = useNavigate()

  const defaultChannels = channels.filter(c => c.isDefault)
  const customChannels = channels.filter(c => !c.isDefault)

  const getOtherUser = (channel) => {
    return channel.members?.find(m => m._id !== user?._id)
  }

  return (
    <div className="w-64 bg-bg-secondary border-r border-white/5 flex flex-col shrink-0">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Connexta</h1>
            <p className="text-xs text-gray-500">Team Communication</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-6">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/app/dm"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Direct Messages</span>
          </NavLink>

          <NavLink
            to="/app/calls"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Calls</span>
          </NavLink>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Channels
          </h3>
          <div className="space-y-0.5">
            {defaultChannels.map(channel => (
              <NavLink
                key={channel._id}
                to={`/app/channels/${channel.slug}`}
                className={({ isActive }) =>
                  `channel-item ${isActive ? 'channel-item-active' : ''}`
                }
              >
                <span className="text-gray-500 text-lg">#</span>
                <span className="truncate">{channel.name?.replace('#', '')}</span>
              </NavLink>
            ))}
            {customChannels.map(channel => (
              <NavLink
                key={channel._id}
                to={`/app/channels/${channel._id}`}
                className={({ isActive }) =>
                  `channel-item ${isActive ? 'channel-item-active' : ''}`
                }
              >
                <span className="text-gray-500 text-lg">#</span>
                <span className="truncate">{channel.name?.replace('#', '')}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {dmChannels.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
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
                  onClick={() => navigate('/app/dm')}
                  className="channel-item w-full text-left"
                >
                  <span className="text-gray-500">+</span>
                  <span>{dmChannels.length - 5} more</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.department}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
