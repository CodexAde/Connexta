import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChannel } from '../context/ChannelContext'
import { useCall } from '../context/CallContext'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import * as messageService from '../services/messageService'
import { Hash, Phone, Users, Video, ArrowDown } from 'lucide-react'

function ChannelPage() {
  const { channelId } = useParams()
  const navigate = useNavigate()
  const { user, socket } = useAuth()
  const { channels, setCurrentChannel, getChannelById, getChannelBySlug } = useChannel()
  const { startCall, joinCall, inCall, ongoingCalls } = useCall()
  
  const [channel, setChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const messagesEndRef = useRef(null)

  // Mobile keyboard handling - robust scroll approach
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const inputRef = useRef(null)
  const chatAreaRef = useRef(null)
  
  // Scroll button state
  const [showScrollButton, setShowScrollButton] = useState(false)

  useEffect(() => {
    let scrollTimeoutId = null;
    
    const scrollToInput = () => {
      // Clear any pending scroll
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      
      // Scroll the chat area to bottom so input is visible
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
      // Also use scrollIntoView on messages end
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
    };

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const heightDiff = window.innerHeight - viewport.height;
        // If keyboard is open (height difference > 100px)
        if (heightDiff > 100) {
          setIsKeyboardOpen(true);
          scrollToInput();
        } else {
          setIsKeyboardOpen(false);
        }
      }
    };

    const handleInputFocus = () => {
      // Immediate scroll
      scrollToInput();
      // Single backup scroll after keyboard opens
      scrollTimeoutId = setTimeout(scrollToInput, 300);
    };

    // Listen for visual viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    // Listen for input focus
    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleInputFocus);
    }

    return () => {
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      if (input) {
        input.removeEventListener('focus', handleInputFocus);
      }
    };
  }, [])

  useEffect(() => {
    loadChannel()
  }, [channelId, channels])

  useEffect(() => {
    if (channel) {
      loadMessages(1, false)
      
      if (socket) {
        socket.emit('call:join', { roomId: channel._id, roomType: 'channel' })
        // Also ensure message socket room is joined if distinct from call room
        socket.emit('join:channel', channel._id)
      }
    }
  }, [channel, socket])

  useEffect(() => {
    if (socket && channel) {
      const handleNewMessage = (message) => {
        if (message.channel === channel._id) {
          setMessages(prev => [...prev, message])
        }
      }

      socket.on('message:new', handleNewMessage)

      return () => {
        socket.off('message:new', handleNewMessage)
      }
    }
  }, [socket, channel])

  // Scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      // Use a timestamp or ID comparison. For simplicity, just scroll if length increased or last msg changed
      // But we must ignore "fetch more" (which prepends).
      // Since this effect runs after render, checking 'lastMsg._id' against ref is best?
      // Or simply: if !isFetchingMore, scroll.
      if (!isFetchingMore) {
        scrollToBottom('smooth')
      }
    }
  }, [messages, isFetchingMore])

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

  const loadMessages = async (pageNum = 1, isLoadMore = false) => {
    if (!channel?._id) return
    
    try {
      if (!isLoadMore) setLoading(true)
      else setIsFetchingMore(true)

      const data = await messageService.getChannelMessages(channel._id, pageNum)
      
      const newMessages = data.messages || []
      
      if (newMessages.length < 50) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }

      if (isLoadMore) {
        // Prepend old messages
        setMessages(prev => [...newMessages, ...prev])
      } else {
        setMessages(newMessages)
        // Instant scroll on initial load
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

  const handleSendMessage = async (content, attachments) => {
    if (!channel?._id) return

    try {
      await messageService.createMessage({
        channelId: channel._id,
        content,
        attachments
      })
      // Message update via socket will trigger scrollToBottom
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleStartCall = async (withVideo = false) => {
    if (!channel?._id || inCall) return
    
    try {
      // Check if call already exists
      const ongoingCall = ongoingCalls[channel._id]
      if (ongoingCall) {
        await joinCall(ongoingCall)
        navigate('/call')
        return
      }

      const call = await startCall('channel', channel._id, null, withVideo)
      if (call) {
        navigate('/call')
      }
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }
  
  const handleJoinOngoingCall = async () => {
    const ongoingCall = ongoingCalls[channel?._id]
    if (ongoingCall) {
       await joinCall(ongoingCall, true) // Default to video on
       navigate('/call')
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
  
  const activeCall = ongoingCalls[channel._id]

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
            <div className="flex items-center gap-2">
              <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {channel.members?.length || 0} members
              </p>
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
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={chatAreaRef} className="flex-1 overflow-hidden flex flex-col relative">
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
            onScrollChange={setShowScrollButton}
          />
        )}

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom('smooth')}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute bottom-2 right-4 p-2 rounded-full bg-white text-gray-800 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200 z-40 flex items-center justify-center"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={`shrink-0 bg-black ${isKeyboardOpen ? 'pb-20' : 'pb-4'}`}>
        <MessageInput 
          onSendMessage={handleSendMessage} 
          placeholder={`Message #${channel.name?.replace('#', '') || 'channel'}`}
          inputRef={inputRef}
        />
      </div>
    </div>
  )
}

export default ChannelPage
