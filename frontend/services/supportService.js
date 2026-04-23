const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const supportService = {
  async createContactMessage(payload) {
    await wait();
    // Backend hook: POST /support/contact
    return { success: true, id: `msg-${Date.now()}`, payload };
  },
  async sendChatMessage(message) {
    await wait();
    // Backend hook: POST /support/chat
    return { reply: `Réponse mockée: ${message}` };
  },
};
