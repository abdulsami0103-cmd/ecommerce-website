import api from './api';

const chatService = {
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data.data;
  },

  startConversation: async (participantId) => {
    const response = await api.post('/conversations', { participantId });
    return response.data.data;
  },

  getMessages: async (conversationId, params = {}) => {
    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params,
    });
    return response.data;
  },

  sendMessage: async (conversationId, content, attachments = []) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      content,
      attachments,
    });
    return response.data.data;
  },
};

export default chatService;
