import apiClient from './apiClient'

export const createCall = async (callData) => {
  const response = await apiClient.post('/api/calls', callData)
  return response.data
}

export const getActiveCall = async (params) => {
  const queryString = new URLSearchParams(params).toString()
  const response = await apiClient.get(`/api/calls/active?${queryString}`)
  return response.data
}

export const joinCall = async (callId) => {
  const response = await apiClient.post(`/api/calls/${callId}/join`)
  return response.data
}

export const leaveCall = async (callId) => {
  const response = await apiClient.post(`/api/calls/${callId}/leave`)
  return response.data
}

export const endCall = async (callId) => {
  const response = await apiClient.post(`/api/calls/${callId}/end`)
  return response.data
}

export const getUserCalls = async () => {
  const response = await apiClient.get('/api/calls/user')
  return response.data
}
