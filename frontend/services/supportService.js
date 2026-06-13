import { apiClient } from './apiClient.js';

export const supportService = {
  async createContactMessage({ name, email, subject, message }) {
    const data = await apiClient.post('/pg/support/contact', { name, email, subject, message });
    return data;
  },
  async sendChatMessage(message) {
    try {
      const data = await apiClient.post('/pg/support/chat', { message });
      return { reply: data.reply || data.message || 'Message reçu.' };
    } catch {
      return { reply: 'Je ne peux pas répondre pour le moment. Utilisez le formulaire de contact.' };
    }
  },

  async escalateChatbot({ email, name, transcript }) {
    return apiClient.post('/pg/support/chatbot-escalate', { email, name, transcript });
  },
};
