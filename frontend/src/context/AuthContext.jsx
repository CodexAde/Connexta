import { createContext, useContext, useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('connexta_token'))
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token }
      })

      newSocket.on('connect', () => {
        console.log('Socket connected')
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [user, token])

  const verifyToken = async () => {
    try {
      const data = await authService.getMe()
      setUser(data.user)
    } catch (error) {
      localStorage.removeItem('connexta_token')
      localStorage.removeItem('connexta_user')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    localStorage.setItem('connexta_token', data.token)
    localStorage.setItem('connexta_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const register = async (formData) => {
    const data = await authService.register(formData)
    localStorage.setItem('connexta_token', data.token)
    localStorage.setItem('connexta_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('connexta_token')
    localStorage.removeItem('connexta_user')
    setToken(null)
    setUser(null)
    if (socket) {
      socket.disconnect()
    }
  }

  const value = {
    user,
    token,
    loading,
    socket,
    login,
    register,
    logout,
    setUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
