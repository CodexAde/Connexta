import apiClient from './apiClient'

export const getChannels = async () => {
  const response = await apiClient.get('/api/channels')
  return response.data
}

export const getChannelById = async (channelId) => {
  const response = await apiClient.get(`/api/channels/${channelId}`)
  return response.data
}

export const createChannel = async (channelData) => {
  const response = await apiClient.post('/api/channels', channelData)
  return response.data
}

export const getDMChannel = async (userId) => {
  const response = await apiClient.get(`/api/channels/dm/${userId}`)
  return response.data
}

export const getUserDMs = async () => {
  const response = await apiClient.get('/api/channels/dms')
  return response.data
}

export const joinChannel = async (channelId) => {
  const response = await apiClient.post(`/api/channels/${channelId}/join`)
  return response.data
}
