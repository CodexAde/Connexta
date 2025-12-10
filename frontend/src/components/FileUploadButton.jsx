import { useRef } from 'react'

function FileUploadButton({ onFileSelect, multiple = false, accept = '*', disabled = false, children }) {
  const fileInputRef = useRef(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      onFileSelect(multiple ? files : files[0])
    }
    e.target.value = ''
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {children || (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </>
  )
}

export default FileUploadButton
