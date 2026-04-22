import { apiClient } from './apiClient.js';

export const supportService = {
  createContactMessage(payload) {
    return apiClient.post('/support/contact', payload);
  },
  sendChatMessage(message) {
    return apiClient.post('/support/chat', { message });
  },
};
