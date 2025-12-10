import { useRef } from 'react'
import Avatar from './Avatar'

function MessageList({ messages, currentUserId, onLoadMore, hasMore, isFetchingMore, bottomRef, onScrollChange }) {
  const scrollRef = useRef(null)
  
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && onLoadMore && !isFetchingMore) {
      // Trigger load more
      onLoadMore().then(() => {
        // Scroll restoration could happen here if needed, but usually handled by parent 
        // managing state updates or calculating scroll height diff.
        // Since React state update is async, we can't easily restore scroll here synchronously.
      });
    }

    // Notify parent about scroll position for scroll-to-bottom button
    if (onScrollChange) {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      // Show button if we are more than 200px away from bottom
      const isDistanceFromBottom = scrollHeight - scrollTop - clientHeight > 200;
      onScrollChange(isDistanceFromBottom);
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const groupMessagesByDate = (messages) => {
    const groups = {}
    messages.forEach(message => {
      const dateKey = new Date(message.createdAt).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    return groups
  }

  const renderAttachment = (attachment) => {
    if (attachment.type === 'image') {
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2"
        >
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="max-w-xs rounded-xl border border-white/10"
          />
        </a>
      )
    }

    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 mt-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.08] hover:bg-white/[0.06] transition-colors max-w-xs"
      >
        <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{attachment.fileName}</p>
          <p className="text-xs text-gray-500">
            {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Document'}
          </p>
        </div>
      </a>
    )
  }

  // Process message content to handle line breaks properly
  const renderContent = (content, isOwn) => {
    if (!content) return null
    
    const lines = content.split('\n')
    return lines.map((line, index) => (
      <span key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ))
  }

  const groupedMessages = groupMessagesByDate(messages)

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No messages yet</h3>
          <p className="text-gray-600 text-sm">Be the first to send a message!</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
      onScroll={handleScroll}
      ref={scrollRef}
    >
      {isFetchingMore && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          {/* Date divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.05]"></div>
            <span className="text-xs font-medium text-gray-600 px-2">{formatDate(dateMessages[0].createdAt)}</span>
            <div className="flex-1 h-px bg-white/[0.05]"></div>
          </div>

          <div className="space-y-4">
            {dateMessages.map((message, index) => {
              const isOwnMessage = message.sender?._id === currentUserId
              const showAvatar = index === 0 || 
                dateMessages[index - 1]?.sender?._id !== message.sender?._id

              return (
                <div
                  key={message._id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} ${
                    !showAvatar ? (isOwnMessage ? 'mr-11' : 'ml-11') : ''
                  }`}
                >
                  {showAvatar && (
                    <div className="shrink-0">
                      <Avatar user={message.sender} size="sm" />
                    </div>
                  )}

                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1.5 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-medium text-white">
                          {message.sender?.name}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={isOwnMessage ? 'message-bubble-own' : 'message-bubble'}>
                      {message.content && (
                        <p className={`text-sm leading-relaxed ${isOwnMessage ? 'text-black' : 'text-white/90'}`}>
                          {renderContent(message.content, isOwnMessage)}
                        </p>
                      )}
                      {message.attachments?.map((attachment, i) => (
                        <div key={i}>
                          {renderAttachment(attachment)}
                        </div>
                      ))}
                    </div>

                    {message.isEdited && (
                      <span className="text-xs text-gray-600 mt-1">(edited)</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
