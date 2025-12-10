import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChannel } from '../context/ChannelContext'
import { useCall } from '../context/CallContext'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import * as messageService from '../services/messageService'

function ChannelPage() {
  const { channelId } = useParams()
  const { user, socket } = useAuth()
  const { channels, setCurrentChannel, getChannelById, getChannelBySlug } = useChannel()
  const { startCall, inCall } = useCall()
  
  const [channel, setChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadChannel()
  }, [channelId, channels])

  useEffect(() => {
    if (channel) {
      loadMessages()
    }
  }, [channel])

  useEffect(() => {
    if (socket && channel) {
      const handleNewMessage = (message) => {
        setMessages(prev => [...prev, message])
        scrollToBottom()
      }

      socket.on('message:new', handleNewMessage)

      return () => {
        socket.off('message:new', handleNewMessage)
      }
    }
  }, [socket, channel])

  const loadChannel = async () => {
    let foundChannel = getChannelBySlug(channelId)
    
    if (!foundChannel && channels.length > 0) {
      foundChannel = channels.find(c => c._id === channelId)
    }
    
    if (!foundChannel) {
      try {
        foundChannel = await getChannelById(channelId)
      } catch (error) {
        console.error('Failed to load channel:', error)
      }
    }
    
    if (foundChannel) {
      setChannel(foundChannel)
      setCurrentChannel(foundChannel)
    }
  }

  const loadMessages = async () => {
    if (!channel?._id) return
    
    try {
      setLoading(true)
      const data = await messageService.getChannelMessages(channel._id)
      setMessages(data.messages)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (content, attachments) => {
    if (!channel?._id) return

    try {
      await messageService.createMessage({
        channelId: channel._id,
        content,
        attachments
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleStartCall = async () => {
    if (!channel?._id || inCall) return
    
    try {
      await startCall('channel', channel._id)
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  if (!channel) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading channel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-400">#</span>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {channel.name?.replace('#', '')}
            </h2>
            <p className="text-sm text-gray-500">
              {channel.members?.length || 0} members
            </p>
          </div>
        </div>
        
        <button
          onClick={handleStartCall}
          disabled={inCall}
          className="btn-accent flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Start Call
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <MessageList messages={messages} currentUserId={user?._id} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={handleSendMessage} placeholder={`Message #${channel.name?.replace('#', '') || 'channel'}`} />
    </div>
  )
}

export default ChannelPage
