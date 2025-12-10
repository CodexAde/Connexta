import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'
import { useChannel } from '../context/ChannelContext'
import { useCall } from '../context/CallContext'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import UserSearch from '../components/UserSearch'
import Avatar from '../components/Avatar'
import * as messageService from '../services/messageService'
import { Phone, ArrowLeft, MessageSquare, Video } from 'lucide-react'

function DMsPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user, socket } = useAuth()
  const { users, getUserById } = useUser()
  const { dmChannels, getOrCreateDMChannel, setCurrentChannel } = useChannel()
  const { startCall, inCall } = useCall()

  const [selectedUser, setSelectedUser] = useState(null)
  const [dmChannel, setDmChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (userId) {
      loadDMUser(userId)
      setShowChat(true)
    }
  }, [userId])

  useEffect(() => {
    if (selectedUser) {
      loadDMChannel()
    }
  }, [selectedUser])

  useEffect(() => {
    if (socket && dmChannel) {
      const handleNewMessage = (message) => {
        if (message.dmRoomId === dmChannel.slug) {
          setMessages(prev => [...prev, message])
          scrollToBottom()
        }
      }

      socket.on('message:new', handleNewMessage)

      return () => {
        socket.off('message:new', handleNewMessage)
      }
    }
  }, [socket, dmChannel])

  const loadDMUser = async (id) => {
    let foundUser = users.find(u => u._id === id)
    if (!foundUser) {
      foundUser = await getUserById(id)
    }
    if (foundUser) {
      setSelectedUser(foundUser)
    }
  }

  const loadDMChannel = async () => {
    if (!selectedUser) return
    
    try {
      setLoading(true)
      const channel = await getOrCreateDMChannel(selectedUser._id)
      setDmChannel(channel)
      setCurrentChannel(channel)
      await loadMessages()
    } catch (error) {
      console.error('Failed to load DM channel:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!selectedUser) return
    
    try {
      const data = await messageService.getDMMessages(selectedUser._id)
      setMessages(data.messages)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser)
    setShowChat(true)
    navigate(`/app/dm/${selectedUser._id}`)
  }

  const handleSendMessage = async (content, attachments) => {
    if (!selectedUser) return

    try {
      await messageService.createMessage({
        content,
        attachments,
        isDm: true,
        recipientId: selectedUser._id
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleStartCall = async (withVideo = false) => {
    if (!selectedUser || inCall) return
    
    try {
      const call = await startCall('dm', null, selectedUser._id, withVideo)
      if (call) {
        navigate('/call')
      }
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  const handleBack = () => {
    setShowChat(false)
    setSelectedUser(null)
    navigate('/app/dm')
  }

  const getOtherUser = (channel) => {
    return channel.members?.find(m => m._id !== user?._id)
  }

  // Mobile: show either list or chat
  const showListOnMobile = !showChat || !selectedUser

  return (
    <div className="h-full flex">
      {/* DM List - Hidden on mobile when chat is open */}
      <div className={`w-full md:w-72 border-r border-white/[0.05] flex flex-col shrink-0 ${showListOnMobile ? 'block' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-white/[0.05]">
          <h2 className="text-lg font-semibold text-white mb-4">Direct Messages</h2>
          <UserSearch onUserSelect={handleUserSelect} />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {dmChannels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1 text-gray-600">Search for a user to start messaging</p>
            </div>
          ) : (
            <div className="space-y-1">
              {dmChannels.map(channel => {
                const otherUser = getOtherUser(channel)
                if (!otherUser) return null
                
                return (
                  <button
                    key={channel._id}
                    onClick={() => handleUserSelect(otherUser)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      selectedUser?._id === otherUser._id
                        ? 'bg-white/[0.08] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Avatar user={otherUser} size="sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium truncate">{otherUser.name}</p>
                      <p className="text-xs text-gray-600 truncate">{otherUser.department}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      otherUser.status === 'online' ? 'bg-green-500' : 'bg-gray-600'
                    }`}></div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${showListOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/[0.05] shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={handleBack}
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <Avatar user={selectedUser} size="md" />
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-white">{selectedUser.name}</h2>
                  <p className="text-xs md:text-sm text-gray-600">{selectedUser.department}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCall(false)}
                  disabled={inCall}
                  className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors disabled:opacity-50"
                  title="Audio call"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleStartCall(true)}
                  disabled={inCall}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Video</span>
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
              placeholder={`Message ${selectedUser.name}`} 
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a person from the list or search for someone new</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DMsPage
