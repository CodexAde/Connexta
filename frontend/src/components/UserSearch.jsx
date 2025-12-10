import { useState, useEffect, useRef } from 'react'
import { useUser } from '../context/UserContext'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import { Search } from 'lucide-react'

function UserSearch({ onUserSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { searchUsers } = useUser()
  const { user: currentUser } = useAuth()
  const wrapperRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const users = await searchUsers(query)
      // Filter out current user from results (safety fallback)
      const filteredUsers = users.filter(u => u._id !== currentUser?._id)
      setResults(filteredUsers)
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, currentUser?._id])

  const handleSelect = (user) => {
    onUserSelect(user)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search users..."
          className="input-field pl-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showResults && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {loading ? 'Searching...' : 'No users found'}
            </div>
          ) : (
            <div className="p-2">
              {results.map(user => (
                <button
                  key={user._id}
                  onClick={() => handleSelect(user)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Avatar user={user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className="badge-info text-xs">{user.department}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserSearch
