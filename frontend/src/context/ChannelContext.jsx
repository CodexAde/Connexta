import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import * as channelService from '../services/channelService'

const ChannelContext = createContext(null)

export const useChannel = () => {
  const context = useContext(ChannelContext)
  if (!context) {
    throw new Error('useChannel must be used within a ChannelProvider')
  }
  return context
}

export const ChannelProvider = ({ children }) => {
  const { user, token, socket } = useAuth()
  const [channels, setChannels] = useState([])
  const [dmChannels, setDmChannels] = useState([])
  const [currentChannel, setCurrentChannel] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && token) {
      loadChannels()
      loadDMChannels()
    }
  }, [user, token])

  useEffect(() => {
    if (socket && currentChannel) {
      if (currentChannel.type === 'dm') {
        socket.emit('join:dm', currentChannel.slug)
      } else {
        socket.emit('join:channel', currentChannel._id)
      }

      return () => {
        if (currentChannel.type === 'dm') {
          socket.emit('leave:dm', currentChannel.slug)
        } else {
          socket.emit('leave:channel', currentChannel._id)
        }
      }
    }
  }, [socket, currentChannel])

  const loadChannels = async () => {
    try {
      setLoading(true)
      const data = await channelService.getChannels()
      const nonDmChannels = data.channels.filter(c => c.type !== 'dm')
      setChannels(nonDmChannels)
    } catch (error) {
      console.error('Failed to load channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDMChannels = async () => {
    try {
      const data = await channelService.getUserDMs()
      setDmChannels(data.channels)
    } catch (error) {
      console.error('Failed to load DM channels:', error)
    }
  }

  const getChannelById = async (channelId) => {
    try {
      const data = await channelService.getChannelById(channelId)
      return data.channel
    } catch (error) {
      console.error('Failed to get channel:', error)
      return null
    }
  }

  const getOrCreateDMChannel = async (userId) => {
    try {
      const data = await channelService.getDMChannel(userId)
      if (!dmChannels.find(c => c._id === data.channel._id)) {
        setDmChannels(prev => [...prev, data.channel])
      }
      return data.channel
    } catch (error) {
      console.error('Failed to get DM channel:', error)
      return null
    }
  }

  const getChannelBySlug = (slug) => {
    return channels.find(c => c.slug === slug)
  }

  const value = {
    channels,
    dmChannels,
    currentChannel,
    loading,
    setCurrentChannel,
    loadChannels,
    loadDMChannels,
    getChannelById,
    getOrCreateDMChannel,
    getChannelBySlug
  }

  return (
    <ChannelContext.Provider value={value}>
      {children}
    </ChannelContext.Provider>
  )
}
