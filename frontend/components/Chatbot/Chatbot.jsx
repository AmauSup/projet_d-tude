import React, { useEffect, useRef, useState } from 'react';
import './Chatbot.css';
import { supportService } from '../../services/supportService.js';

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
  return 'Je n\'ai pas trouvé de réponse précise à votre question. Souhaitez-vous être mis en relation avec un agent ?';
}

function buildTranscript(messages) {
  return messages
    .filter((m) => m.from !== 'system')
    .map((m) => `[${m.from === 'bot' ? 'Bot' : 'Utilisateur'}] ${m.text}`)
    .join('\n');
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [escalateEmail, setEscalateEmail] = useState('');
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('open-chatbot', handler);
    return () => document.removeEventListener('open-chatbot', handler);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = { from: 'user', text };
    const answer = findAnswer(text);
    const botMsg = { from: 'bot', text: answer };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleEscalate = async () => {
    const transcript = buildTranscript(messages);
    await supportService.escalateChatbot({ email: escalateEmail || undefined, transcript });
    setEscalated(true);
    setEscalating(false);
    setMessages((prev) => [
      ...prev,
      {
        from: 'bot',
        text: 'Votre conversation a été transmise à notre équipe. Un agent vous contactera dans les 24h à l\'adresse indiquée. Merci !',
      },
    ]);
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

          {escalating && !escalated ? (
            <div className="chatbot-escalate-form">
              <p className="helper-text">Saisissez votre e-mail pour qu'un agent vous recontacte :</p>
              <input
                className="input"
                type="email"
                placeholder="votre@email.fr"
                value={escalateEmail}
                onChange={(e) => setEscalateEmail(e.target.value)}
                aria-label="Votre adresse e-mail"
              />
              <div className="chatbot-input-row" style={{ marginTop: 6 }}>
                <button type="button" className="btn btn--secondary" onClick={() => setEscalating(false)}>Annuler</button>
                <button type="button" className="btn btn--primary" onClick={handleEscalate}>Envoyer</button>
              </div>
            </div>
          ) : (
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
          )}

          {!escalated && !escalating && (
            <div className="chatbot-footer">
              <button
                type="button"
                className="btn btn--link chatbot-escalate-btn"
                onClick={() => setEscalating(true)}
              >
                Parler à un agent humain
              </button>
            </div>
          )}
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
