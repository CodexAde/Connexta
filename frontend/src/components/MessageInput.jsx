import { useState, useRef } from 'react'
import * as uploadService from '../services/uploadService'
import { Paperclip, Send, X, File } from 'lucide-react'

function MessageInput({ onSendMessage, placeholder = 'Type a message...', onFocus }) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && attachments.length === 0) return

    await onSendMessage(content.trim(), attachments)
    setContent('')
    setAttachments([])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)

    try {
      for (const file of files) {
        const data = await uploadService.uploadFile(file)
        setAttachments(prev => [...prev, data.file])
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="p-3 md:p-4 border-t border-white/[0.05] shrink-0 bg-black">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.08]"
            >
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={attachment.fileName}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <File className="w-5 h-5 text-white/50" />
              )}
              <span className="text-sm text-white truncate max-w-[100px] md:max-w-[150px]">{attachment.fileName}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3">
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            placeholder={placeholder}
            rows={1}
            className="input-field resize-none min-h-[48px] max-h-32 pr-12 text-sm md:text-base py-3"
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute right-3 bottom-3 text-gray-500 hover:text-white transition-colors"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </div>

        <button
          type="submit"
          disabled={(!content.trim() && attachments.length === 0) || uploading}
          className="btn-primary w-12 h-12 flex items-center justify-center rounded-xl disabled:opacity-30 disabled:cursor-not-allowed shrink-0 p-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}

export default MessageInput
