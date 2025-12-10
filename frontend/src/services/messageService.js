import apiClient from './apiClient'

export const createMessage = async (messageData) => {
  const response = await apiClient.post('/api/messages', messageData)
  return response.data
}

export const getChannelMessages = async (channelId, page = 1, limit = 50) => {
  const response = await apiClient.get(`/api/messages/channel/${channelId}?page=${page}&limit=${limit}`)
  return response.data
}

export const getDMMessages = async (userId, page = 1, limit = 50) => {
  const response = await apiClient.get(`/api/messages/dm/${userId}?page=${page}&limit=${limit}`)
  return response.data
}

export const deleteMessage = async (messageId) => {
  const response = await apiClient.delete(`/api/messages/${messageId}`)
  return response.data
}

export const editMessage = async (messageId, content) => {
  const response = await apiClient.put(`/api/messages/${messageId}`, { content })
  return response.data
}
