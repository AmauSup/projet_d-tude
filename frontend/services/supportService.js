import { apiClient } from './apiClient.js';

// Service de support client — gère les formulaires de contact et l'escalade chatbot.
export const supportService = {

  // Envoie un message via le formulaire de contact (page Contact).
  // Le message est enregistré en base de données et visible dans le back-office admin.
  // Paramètres :
  //   name    (string) — nom complet du visiteur
  //   email   (string) — adresse e-mail de contact
  //   subject (string) — objet du message
  //   message (string) — corps du message
  // Retourne :
  //   (object) — réponse brute du backend { success: true }
  async createContactMessage({ name, email, subject, message }) {
    const data = await apiClient.post('/pg/support/contact', { name, email, subject, message });
    return data;
  },

  // Envoie un message texte libre au chatbot et récupère la réponse générée.
  // En cas d'échec réseau ou d'erreur serveur, retourne un message de repli
  // pour ne jamais laisser l'utilisateur sans réponse.
  // Paramètres :
  //   message (string) — texte saisi par l'utilisateur dans le chatbot
  // Retourne :
  //   { reply: string } — réponse du bot (ou message d'erreur générique)
  async sendChatMessage(message) {
    try {
      const data = await apiClient.post('/pg/support/chat', { message });
      // Le champ "reply" ou "message" selon la version du backend
      return { reply: data.reply || data.message || 'Message reçu.' };
    } catch {
      return { reply: 'Je ne peux pas répondre pour le moment. Utilisez le formulaire de contact.' };
    }
  },

  // Escalade la conversation chatbot vers le support humain.
  // Enregistre un message de contact contenant le transcript complet de la conversation.
  // Appelé depuis Chatbot.jsx quand l'utilisateur choisit d'être mis en contact avec un agent.
  // Paramètres :
  //   email      (string)  — adresse e-mail du visiteur (obligatoire pour le rappel)
  //   name       (string)  — prénom optionnel du visiteur
  //   transcript (string)  — historique formaté de la conversation (voir buildTranscript dans Chatbot.jsx)
  // Retourne :
  //   (object) — réponse backend { success: true }
  async escalateChatbot({ email, name, transcript }) {
    return apiClient.post('/pg/support/chatbot-escalate', { email, name, transcript });
  },
};
