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
  const { dmChannels, channels, getOrCreateDMChannel, setCurrentChannel } = useChannel()
  const { startCall, joinCall, inCall, ongoingCalls } = useCall()

  const [selectedUser, setSelectedUser] = useState(null)
  const [dmChannel, setDmChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [showMobileList, setShowMobileList] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const messagesEndRef = useRef(null)
  const viewportRef = useRef(window.visualViewport)

  useEffect(() => {
    if (userId) {
      loadDMUser(userId)
      setShowMobileList(false)
    } else {
      setSelectedUser(null)
      setDmChannel(null)
      setShowMobileList(true)
    }
  }, [userId, users])

  useEffect(() => {
    if (selectedUser) {
      loadDMChannel()
    }
  }, [selectedUser])

  useEffect(() => {
    if (socket && dmChannel) {
      socket.emit('call:join', { roomId: dmChannel._id, roomType: 'dm' })
      // Join the channel room for real-time messages
      socket.emit('join:channel', dmChannel._id)

      const handleNewMessage = (message) => {
        if (message.channel === dmChannel._id) {
          setMessages(prev => [...prev, message])
        }
      }

      socket.on('message:new', handleNewMessage)

      return () => {
        socket.off('message:new', handleNewMessage)
        socket.emit('call:leave', { roomId: dmChannel._id, roomType: 'dm' })
        socket.emit('leave:channel', dmChannel._id)
      }
    }
  }, [socket, dmChannel])

  // Scroll on new messages
  useEffect(() => {
    if (messages.length > 0 && !isFetchingMore) {
        scrollToBottom('smooth')
    }
  }, [messages, isFetchingMore])

  // Handle mobile keyboard
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleResize = () => {
      if (messagesEndRef.current) {
        // Use 'auto' for instant scrolling when keyboard works
        scrollToBottom('auto')
      }
    }

    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
    }
  }, [dmChannel])

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
      await loadMessages(1, false, channel._id)
    } catch (error) {
      console.error('Failed to load DM channel:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (pageNum = 1, isLoadMore = false, channelIdOverride = null) => {
    if (!selectedUser) return
    
    try {
      if (!isLoadMore) setLoading(true)
      else setIsFetchingMore(true)

      // Use getDMMessages via message service
      const data = await messageService.getDMMessages(selectedUser._id, pageNum)
      
      const newMessages = data.messages || []
      
      if (newMessages.length < 50) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }

      if (isLoadMore) {
        setMessages(prev => [...newMessages, ...prev])
      } else {
        setMessages(newMessages)
        setTimeout(() => scrollToBottom('auto'), 50)
      }
      
      setPage(pageNum)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
      setIsFetchingMore(false)
    }
  }

  const handleScrollTop = () => {
    if (!isFetchingMore && hasMore) {
      loadMessages(page + 1, true)
    }
  }

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // ... (rest is fine up to Render) ...



  const handleUserSelect = (u) => {
    setSelectedUser(u)
    setShowMobileList(false)
    navigate(`/app/dm/${u._id}`)
  }

  const handleSendMessage = async (content, attachments) => {
    if (!dmChannel?._id) return

    try {
      await messageService.createMessage({
        channelId: dmChannel._id,
        content,
        attachments
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleStartCall = async (withVideo = false) => {
    if (!dmChannel?._id || inCall) return
    
    try {
      const ongoingCall = ongoingCalls[dmChannel._id]
      if (ongoingCall) {
        await joinCall(ongoingCall)
        navigate('/call')
        return
      }
      
      const call = await startCall('dm', dmChannel._id, selectedUser._id, withVideo)
      if (call) {
        navigate('/call')
      }
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }
  
  const handleJoinOngoingCall = async () => {
     const ongoingCall = ongoingCalls[dmChannel?._id]
     if (ongoingCall) {
       await joinCall(ongoingCall)
       navigate('/call')
     }
  }
  
  const activeCall = dmChannel ? ongoingCalls[dmChannel._id] : null

  const handleBack = () => {
    setShowMobileList(true)
    setSelectedUser(null)
    navigate('/app/dm')
  }

  const getOtherUser = (channel) => {
    return channel.members?.find(m => m._id !== user?._id)
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar - hidden on mobile when chat is active */}
      <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-r border-white/[0.05] flex-col bg-black`}>
        <div className="p-4 border-b border-white/[0.05]">
          <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
          <UserSearch onUserSelect={(u) => navigate(`/app/dm/${u._id}`)} />
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
      {userId ? (
        <div className={`${!showMobileList ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-black w-full`}>
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBack}
                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar user={selectedUser} size="sm" />
                  <div>
                    <h3 className="font-semibold text-white">{selectedUser.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {selectedUser.isOnline ? 'Online' : 'Offline'}
                      </span>
                      {activeCall && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Call Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {activeCall ? (
                    <button
                      onClick={handleJoinOngoingCall}
                      disabled={inCall}
                      className="btn-primary flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white border-none animate-pulse"
                      title="Join ongoing call"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Call</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleStartCall(false)}
                        disabled={inCall}
                        className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors disabled:opacity-50"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleStartCall(true)}
                        disabled={inCall}
                        className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors disabled:opacity-50"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : (
                   <MessageList 
                    messages={messages} 
                    currentUserId={user?._id} 
                    onLoadMore={handleScrollTop}
                    hasMore={hasMore}
                    isFetchingMore={isFetchingMore}
                    bottomRef={messagesEndRef}
                  />
                )}
              </div>

              <MessageInput 
                onSendMessage={handleSendMessage}
                placeholder={`Message ${selectedUser.name}`}
              />
            </>
          ) : (
             <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
             </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500">
          <div className="text-center">
             <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DMsPage
