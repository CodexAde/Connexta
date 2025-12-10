import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChannel } from '../context/ChannelContext'
import { useCall } from '../context/CallContext'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import * as messageService from '../services/messageService'
import { Hash, Phone, Users, Video } from 'lucide-react'

function ChannelPage() {
  const { channelId } = useParams()
  const navigate = useNavigate()
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

  const handleStartCall = async (withVideo = false) => {
    if (!channel?._id || inCall) return
    
    try {
      const call = await startCall('channel', channel._id, null, withVideo)
      if (call) {
        navigate('/call')
      }
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  if (!channel) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading channel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Channel header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <Hash className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
          <div>
            <h2 className="text-base md:text-lg font-semibold text-white">
              {channel.name?.replace('#', '')}
            </h2>
            <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {channel.members?.length || 0} members
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStartCall(false)}
            disabled={inCall}
            className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors disabled:opacity-50"
            title="Start audio call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleStartCall(true)}
            disabled={inCall}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
            title="Start video call"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Video Call</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <MessageList messages={messages} currentUserId={user?._id} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage} 
        placeholder={`Message #${channel.name?.replace('#', '') || 'channel'}`} 
      />
    </div>
  )
}

export default ChannelPage
