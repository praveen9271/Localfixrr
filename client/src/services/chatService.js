import api from './api'

export const sendChatMessage = async ({ message, sessionId }) => {
  const response = await api.post('/chat', { message, sessionId })
  return response.data
}
