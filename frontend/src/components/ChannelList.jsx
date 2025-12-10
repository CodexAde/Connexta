import { NavLink } from 'react-router-dom'
import { useChannel } from '../context/ChannelContext'

function ChannelList() {
  const { channels } = useChannel()

  const defaultChannels = channels.filter(c => c.isDefault && c.type !== 'dm')
  const departmentChannels = channels.filter(c => c.type === 'department')
  const directorsChannel = channels.filter(c => c.type === 'directors')
  const customChannels = channels.filter(c => !c.isDefault && c.type === 'custom')

  const renderChannelGroup = (title, channelList) => {
    if (channelList.length === 0) return null

    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
          {title}
        </h4>
        <div className="space-y-0.5">
          {channelList.map(channel => (
            <NavLink
              key={channel._id}
              to={`/app/channels/${channel.slug || channel._id}`}
              className={({ isActive }) =>
                `channel-item ${isActive ? 'channel-item-active' : ''}`
              }
            >
              <span className="text-gray-500 text-lg">#</span>
              <span className="truncate">{channel.name?.replace('#', '')}</span>
              {channel.type === 'directors' && (
                <span className="ml-auto">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {renderChannelGroup('Default', defaultChannels.filter(c => c.type === 'default'))}
      {renderChannelGroup('Your Department', departmentChannels)}
      {renderChannelGroup('Leadership', directorsChannel)}
      {renderChannelGroup('Custom', customChannels)}
    </div>
  )
}

export default ChannelList
