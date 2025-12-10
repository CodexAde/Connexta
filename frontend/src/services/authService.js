import apiClient from './apiClient'

export const login = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', { email, password })
  return response.data
}

export const register = async (formData) => {
  const response = await apiClient.post('/api/auth/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const getMe = async () => {
  const response = await apiClient.get('/api/auth/me')
  return response.data
}
