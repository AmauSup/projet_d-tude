import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Chatbot.css';
import { supportService } from '../../services/supportService.js';
import { useI18n } from '../../contexts/I18nContext.jsx';

// FAQ de secours chargée immédiatement (avant même la réponse API).
// Si le backend est indisponible, le chatbot reste fonctionnel avec ces données locales.
// Chaque entrée contient : question (label affiché), keywords (mots-clés pour la détection),
// answer (réponse à afficher).
const FAQ_FALLBACK = [
  { question: 'Mot de passe oublié',        keywords: ['mot de passe','password','mdp','oublié','réinitialiser','reset'],            answer: 'Pour réinitialiser votre mot de passe, cliquez sur "Mot de passe oublié ?" sur la page de connexion. Vous recevrez un e-mail avec un lien de réinitialisation valable 1 heure.' },
  { question: 'Gérer mes adresses',          keywords: ['adresse','livraison','facturation','modifier adresse','changer adresse'],     answer: 'Vous pouvez gérer vos adresses depuis Mon compte → Mes adresses. Vous pouvez ajouter, modifier ou supprimer vos adresses de livraison et de facturation.' },
  { question: 'Suivi de commande',           keywords: ['commande','suivi','statut','où est','expédié'],                              answer: 'Consultez le statut de vos commandes dans Mon compte → Mes commandes. Chaque commande affiche son statut : En préparation, Confirmée, Expédiée ou Livrée.' },
  { question: 'Télécharger une facture',     keywords: ['facture','pdf','télécharger','reçu','document'],                            answer: 'Vous pouvez télécharger la facture PDF de chaque commande depuis Mon compte → Mes commandes → Voir le détail → Télécharger la facture PDF.' },
  { question: 'Retour ou remboursement',     keywords: ['retour','rembours','annul','retourner'],                                     answer: 'Pour une demande de retour ou de remboursement, veuillez contacter notre service client via la page Contact en précisant votre numéro de commande.' },
  { question: 'Paiement par carte',          keywords: ['paiement','carte','moyen de paiement','payer','stripe','paypal'],           answer: "Le paiement s'effectue par carte bancaire lors du checkout. En mode démo, vous pouvez simuler un paiement sans carte réelle." },
  { question: 'Créer un compte',             keywords: ['compte','inscription','créer','register',"s'inscrire"],                     answer: 'Pour créer un compte, cliquez sur "S\'inscrire" dans le menu ou sur la page de connexion. Vous aurez besoin d\'un e-mail professionnel et d\'un mot de passe fort (8 caractères min.).' },
  { question: "Disponibilité d'un produit",  keywords: ['stock','rupture','disponible','indisponible'],                              answer: 'Les produits en rupture de stock sont affichés en bas de la liste avec la mention "En rupture de stock".' },
  { question: 'Contacter le support',        keywords: ['contact','support','aide','assistance','humain'],                           answer: 'Vous pouvez nous contacter via la page Contact (menu → Contact). Notre équipe traite toutes les demandes sous 24h ouvrées.' },
  { question: 'Parcourir le catalogue',      keywords: ['catégorie','catalogue','produit','chercher','trouver'],                     answer: 'Utilisez la barre de recherche ou parcourez le catalogue par catégorie : Diagnostic, Monitoring, Stérilisation, Imagerie, Consommables, Mobilier.' },
];

// Messages fixes du bot. Séparés des données FAQ pour faciliter la traduction future.
// NO_ANSWER_FR déclenche automatiquement le formulaire d'escalade vers le support humain.
const WELCOME_FR = "Bonjour ! Je suis l'assistant Althea Systems. Comment puis-je vous aider ? Vous pouvez me poser des questions sur votre compte, vos commandes, les produits ou le paiement.";
const NO_ANSWER_FR = "Je n'ai pas trouvé de réponse précise à votre question. Souhaitez-vous envoyer un message à notre équipe de support ?";
const ESCALATED_FR = "Votre message a bien été transmis à notre équipe. Un agent vous contactera dans les 24h à l'adresse indiquée. Merci !";

// Normalise un texte pour la comparaison : minuscules + suppression des accents.
// Permet de matcher "réinitialiser" avec "reinitialiser" ou "REINITIALISER".
// normalize('NFD') décompose les caractères accentués (é → e + ́), puis le replace
// supprime les marques diacritiques isolées (plage Unicode des combinants).
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Construit un résumé texte de la conversation pour l'envoyer au support.
// Filtre les messages système (from='system'), ne garde que user et bot,
// puis formate chaque message avec un préfixe lisible par un agent humain.
function buildTranscript(msgs) {
  const lines = msgs
    .filter((m) => m.from === 'user' || m.from === 'bot')
    .map((m) => `[${m.from === 'bot' ? 'Assistant' : 'Utilisateur'}] ${m.text}`);
  return [
    '=== Conversation chatbot ===',
    `Date : ${new Date().toLocaleString('fr-FR')}`,
    '',
    ...lines,
    '============================',
  ].join('\n');
}

export default function Chatbot() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [faq, setFaq] = useState(FAQ_FALLBACK);
  const [messages, setMessages] = useState([{ id: 0, from: 'bot', text: WELCOME_FR }]);
  const msgCounter = useRef(1);
  const [input, setInput] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [escalateEmail, setEscalateEmail] = useState('');
  const [escalateName, setEscalateName] = useState('');
  const [escalated, setEscalated] = useState(false);
  const [escalateError, setEscalateError] = useState('');
  const [escalateSaving, setEscalateSaving] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState(false);
  const bottomRef = useRef(null);

  // Charge le FAQ depuis la base de données
  useEffect(() => {
    fetch('/api/pg/chatbot/faq')
      .then((r) => r.json())
      .then((d) => { if (d.faq?.length) setFaq(d.faq); })
      .catch(() => { /* garde le fallback local */ });
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('open-chatbot', handler);
    return () => document.removeEventListener('open-chatbot', handler);
  }, []);

  // Recherche une réponse dans le FAQ en comparant les mots-clés contre le message normalisé.
  // Retourne NO_ANSWER_FR si aucun mot-clé ne correspond → déclenche l'escalade.
  // useCallback évite de recréer cette fonction à chaque rendu (optimisation performance) :
  // elle n'est recréée que si `faq` change (rechargement depuis l'API ou fallback local).
  const findAnswer = useCallback((input) => {
    const norm = normalize(input);
    for (const entry of faq) {
      const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
      if (keywords.some((kw) => norm.includes(normalize(kw)))) return entry.answer;
    }
    return NO_ANSWER_FR;
  }, [faq]);

  // Traite l'envoi d'un message (texte libre ou chip cliqué via overrideText).
  // Si la réponse est le message "pas de réponse", bascule automatiquement en mode escalade
  // pour proposer à l'utilisateur d'être mis en contact avec un agent humain.
  const handleSend = (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    const answer = findAnswer(text);
    const isEscalation = answer === NO_ANSWER_FR;
    const userMsg = { id: msgCounter.current++, from: 'user', text };
    const botMsg = { id: msgCounter.current++, from: 'bot', text: answer };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
    if (isEscalation) setEscalating(true);
  };

  // Gère le clic sur une question pré-enregistrée (chip).
  // Contrairement à handleSend, affiche directement la réponse sans passer par findAnswer
  // (la réponse est déjà connue depuis l'objet entry). Cela évite un passage inutile
  // par l'algorithme de recherche par mots-clés et garantit une réponse exacte.
  const handleChip = (entry) => {
    const userMsg = { id: msgCounter.current++, from: 'user', text: entry.question };
    const botMsg = { id: msgCounter.current++, from: 'bot', text: entry.answer };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Envoie la conversation au support humain via l'API.
  // Construit un transcript formaté puis appelle supportService.escalateChatbot().
  // Affiche un état "Envoi…" pendant la requête pour le feedback utilisateur.
  // En cas de succès, ajoute un message de confirmation dans le fil de conversation.
  const handleEscalate = async () => {
    if (!escalateEmail.trim()) {
      setEscalateError('Veuillez saisir votre adresse e-mail.');
      return;
    }
    setEscalateSaving(true);
    setEscalateError('');
    const transcript = buildTranscript(messages);
    try {
      await supportService.escalateChatbot({
        email: escalateEmail.trim(),
        name: escalateName.trim() || undefined,
        transcript,
      });
      setEscalated(true);
      setEscalating(false);
      setMessages((prev) => [
        ...prev,
        { id: msgCounter.current++, from: 'bot', text: ESCALATED_FR },
      ]);
    } catch {
      setEscalateError("L'envoi a échoué. Veuillez réessayer ou utiliser la page Contact.");
    } finally {
      setEscalateSaving(false);
    }
  };

  return (
    <div className="chatbot-root">
      {open && (
        <dialog open className="chatbot-panel" aria-label={t('chatbot.ariaLabel')}>
          <div className="chatbot-header">
            <span>{t('chatbot.title')}</span>
            <button type="button" className="chatbot-close" onClick={() => setOpen(false)} aria-label={t('chatbot.close')}>✕</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-msg chatbot-msg--${msg.from}`}>
                {msg.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {!escalated && !escalating && (
            <div className="chatbot-suggestions">
              <button
                type="button"
                className="chatbot-suggestions-toggle"
                onClick={() => setFaqExpanded((v) => !v)}
              >
                Questions fréquentes {faqExpanded ? '▲' : '▼'}
              </button>
              {faqExpanded && (
                <div className="chatbot-suggestions-list">
                  {faq.map((entry) => (
                    <button
                      key={entry.question}
                      type="button"
                      className="chatbot-suggestion-btn"
                      onClick={() => handleChip(entry)}
                    >
                      {entry.question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {escalating && !escalated ? (
            <div className="chatbot-escalate-form">
              <p className="helper-text" style={{ margin: '0 0 6px' }}>
                Envoyez votre conversation à notre équipe. Nous vous répondrons par e-mail sous 24h.
              </p>
              {escalateError && (
                <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '0 0 6px' }}>{escalateError}</p>
              )}
              <input
                className="input"
                type="text"
                placeholder="Votre prénom (optionnel)"
                value={escalateName}
                onChange={(e) => setEscalateName(e.target.value)}
              />
              <input
                className="input"
                type="email"
                placeholder="Votre adresse e-mail *"
                value={escalateEmail}
                onChange={(e) => setEscalateEmail(e.target.value)}
                aria-label={t('chatbot.emailAriaLabel')}
                required
              />
              <div className="chatbot-input-row" style={{ marginTop: 6 }}>
                <button type="button" className="btn btn--secondary" onClick={() => { setEscalating(false); setEscalateError(''); }}>
                  {t('chatbot.cancel')}
                </button>
                <button type="button" className="btn btn--primary" onClick={handleEscalate} disabled={escalateSaving}>
                  {escalateSaving ? 'Envoi…' : 'Envoyer au support'}
                </button>
              </div>
            </div>
          ) : (
            !escalated && (
              <div className="chatbot-input-row">
                <input
                  className="input chatbot-input"
                  type="text"
                  placeholder={t('chatbot.placeholder')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  aria-label={t('chatbot.placeholder')}
                />
                <button type="button" className="btn btn--primary chatbot-send" onClick={() => handleSend()}>
                  {t('chatbot.send')}
                </button>
              </div>
            )
          )}

          {!escalated && !escalating && (
            <div className="chatbot-footer">
              <button
                type="button"
                className="btn btn--link chatbot-escalate-btn"
                onClick={() => setEscalating(true)}
              >
                {t('chatbot.escalate')}
              </button>
            </div>
          )}
        </dialog>
      )}
      <button
        type="button"
        className="chatbot-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t('chatbot.close') : t('chatbot.open')}
        aria-expanded={open}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
