import React, { useEffect, useRef, useState } from 'react';
import './Chatbot.css';

const FAQ = [
  {
    keywords: ['mot de passe', 'password', 'mdp', 'oublié', 'réinitialiser', 'reset'],
    answer: 'Pour réinitialiser votre mot de passe, cliquez sur "Mot de passe oublié ?" sur la page de connexion. Vous recevrez un e-mail avec un lien de réinitialisation valable 1 heure.',
  },
  {
    keywords: ['adresse', 'livraison', 'facturation', 'modifier adresse', 'changer adresse'],
    answer: 'Vous pouvez gérer vos adresses depuis Mon compte → Mes adresses. Vous pouvez ajouter, modifier ou supprimer vos adresses de livraison et de facturation.',
  },
  {
    keywords: ['commande', 'suivi', 'statut', 'où est', 'livraison', 'expédié'],
    answer: 'Consultez le statut de vos commandes dans Mon compte → Mes commandes. Chaque commande affiche son statut : En préparation, Confirmée, Expédiée ou Livrée.',
  },
  {
    keywords: ['facture', 'pdf', 'télécharger', 'reçu', 'document'],
    answer: 'Vous pouvez télécharger la facture PDF de chaque commande depuis Mon compte → Mes commandes → Voir le détail → Télécharger la facture PDF.',
  },
  {
    keywords: ['retour', 'rembours', 'annul', 'retourner'],
    answer: 'Pour une demande de retour ou de remboursement, veuillez contacter notre service client via la page Contact en précisant votre numéro de commande.',
  },
  {
    keywords: ['paiement', 'carte', 'moyen de paiement', 'payer', 'stripe', 'paypal'],
    answer: 'Le paiement s\'effectue par carte bancaire lors du checkout. En mode démo, vous pouvez simuler un paiement sans carte réelle. Les données ne sont jamais stockées en clair.',
  },
  {
    keywords: ['compte', 'inscription', 'créer', 'register', 's\'inscrire'],
    answer: 'Pour créer un compte, cliquez sur "S\'inscrire" dans le menu ou sur la page de connexion. Vous aurez besoin d\'un e-mail professionnel et d\'un mot de passe fort (8 caractères min.).',
  },
  {
    keywords: ['stock', 'rupture', 'disponible', 'indisponible'],
    answer: 'Les produits en rupture de stock sont affichés en bas de la liste avec la mention "En rupture de stock". Vous pouvez suivre les disponibilités sur chaque fiche produit.',
  },
  {
    keywords: ['contact', 'support', 'aide', 'assistance', 'humain'],
    answer: 'Vous pouvez nous contacter via la page Contact (menu → Contact). Notre équipe traite toutes les demandes sous 24h ouvrées.',
  },
  {
    keywords: ['catégorie', 'catalogue', 'produit', 'chercher', 'trouver'],
    answer: 'Utilisez la barre de recherche en haut de la page ou parcourez le catalogue par catégorie : Diagnostic, Monitoring, Stérilisation, Imagerie, Consommables, Mobilier.',
  },
];

const WELCOME = 'Bonjour ! Je suis l\'assistant Althea Systems. Comment puis-je vous aider ? Vous pouvez me poser des questions sur votre compte, vos commandes, les produits ou le paiement.';

function findAnswer(input) {
  const normalized = input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const entry of FAQ) {
    if (entry.keywords.some((kw) => normalized.includes(kw.normalize('NFD').replace(/[̀-ͯ]/g, '')))) {
      return entry.answer;
    }
  }
  return 'Je n\'ai pas trouvé de réponse précise à votre question. Pour une aide personnalisée, contactez notre équipe via la page Contact.';
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: WELCOME }]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = { from: 'user', text };
    const botMsg = { from: 'bot', text: findAnswer(text) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="chatbot-root">
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="Assistant Althea Systems">
          <div className="chatbot-header">
            <span>💬 Assistant Althea</span>
            <button type="button" className="chatbot-close" onClick={() => setOpen(false)} aria-label="Fermer le chat">✕</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg--${msg.from}`}>
                {msg.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chatbot-input-row">
            <input
              className="input chatbot-input"
              type="text"
              placeholder="Posez votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              aria-label="Message"
            />
            <button type="button" className="btn btn--primary chatbot-send" onClick={handleSend}>
              Envoyer
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        className="chatbot-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        aria-expanded={open}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
