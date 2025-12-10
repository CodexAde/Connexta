import apiClient from './apiClient'

export const getProfile = async () => {
  const response = await apiClient.get('/api/users/profile')
  return response.data
}

export const searchUsers = async (query) => {
  const response = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`)
  return response.data
}

export const getAllUsers = async () => {
  const response = await apiClient.get('/api/users/all')
  return response.data
}

export const getUserById = async (userId) => {
  const response = await apiClient.get(`/api/users/${userId}`)
  return response.data
}

export const updateProfile = async (updates) => {
  const response = await apiClient.put('/api/users/profile', updates)
  return response.data
}
