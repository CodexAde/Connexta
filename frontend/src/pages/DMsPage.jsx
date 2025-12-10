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
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (userId) {
      loadDMUser(userId)
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

  const handleStartCall = async () => {
    if (!selectedUser || inCall) return
    
    try {
      await startCall('dm', null, selectedUser._id)
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  const getOtherUser = (channel) => {
    return channel.members?.find(m => m._id !== user?._id)
  }

  return (
    <div className="h-full flex">
      <div className="w-72 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Direct Messages</h2>
          <UserSearch onUserSelect={handleUserSelect} />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {dmChannels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Search for a user to start messaging</p>
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
                        ? 'bg-indigo-500/20 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Avatar user={otherUser} size="sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium truncate">{otherUser.name}</p>
                      <p className="text-xs text-gray-500 truncate">{otherUser.department}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      otherUser.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedUser ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar user={selectedUser} size="md" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.department}</p>
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
                Call
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

            <MessageInput 
              onSendMessage={handleSendMessage} 
              placeholder={`Message ${selectedUser.name}`} 
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-gray-400">Choose a person from the list or search for someone new</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DMsPage
