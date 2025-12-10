import Avatar from './Avatar'

function MessageList({ messages, currentUserId }) {
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
        className="flex items-center gap-3 mt-2 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors max-w-xs"
      >
        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const groupedMessages = groupMessagesByDate(messages)

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No messages yet</h3>
          <p className="text-gray-500 text-sm">Be the first to send a message!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-xs font-medium text-gray-500">{formatDate(dateMessages[0].createdAt)}</span>
            <div className="flex-1 h-px bg-white/5"></div>
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
                    !showAvatar ? (isOwnMessage ? 'pr-12' : 'pl-12') : ''
                  } animate-fade-in`}
                >
                  {showAvatar && (
                    <Avatar user={message.sender} size="sm" />
                  )}

                  <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-medium text-white">
                          {message.sender?.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.createdAt)}
                        </span>
                        {message.sender?.department && (
                          <span className="badge-info text-xs">
                            {message.sender.department}
                          </span>
                        )}
                      </div>
                    )}

                    <div className={isOwnMessage ? 'message-bubble-own' : 'message-bubble'}>
                      {message.content && (
                        <p className="text-sm text-white whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                      {message.attachments?.map((attachment, i) => (
                        <div key={i}>
                          {renderAttachment(attachment)}
                        </div>
                      ))}
                    </div>

                    {message.isEdited && (
                      <span className="text-xs text-gray-500 mt-1">(edited)</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default MessageList
