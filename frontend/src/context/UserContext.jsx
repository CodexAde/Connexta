import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import * as userService from '../services/userService'

const UserContext = createContext(null)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const { user: authUser, token } = useAuth()
  const [users, setUsers] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (authUser && token) {
      loadUsers()
    }
  }, [authUser, token])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.getAllUsers()
      setUsers(data.users)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      return []
    }
    
    try {
      const data = await userService.searchUsers(query)
      setSearchResults(data.users)
      return data.users
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }

  const getUserById = async (userId) => {
    try {
      const data = await userService.getUserById(userId)
      return data.user
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  }

  const value = {
    users,
    searchResults,
    loading,
    loadUsers,
    searchUsers,
    getUserById
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
