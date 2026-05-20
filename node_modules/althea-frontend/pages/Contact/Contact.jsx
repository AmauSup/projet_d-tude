import React, { useEffect, useRef, useState } from 'react';
import './Contact.css';
import { apiClient } from '../../services/apiClient.js';

const FAQ = [
  {
    triggers: ['livraison', 'délai', 'expédition', 'recevoir', 'envoi'],
    answer: 'Nous expédions sous 24 h ouvrées. Les délais de livraison sont de 3 à 7 jours ouvrés selon votre zone. La livraison est gratuite à partir de 50 €.',
  },
  {
    triggers: ['retour', 'rembours', 'renvoyer', 'échange', 'annuler'],
    answer: 'Vous avez 14 jours après réception pour retourner un article. Contactez-nous par ce formulaire avec votre numéro de commande et nous organisons le retour.',
  },
  {
    triggers: ['commande', 'suivi', 'statut', 'où est'],
    answer: 'Consultez votre historique de commandes dans votre espace compte. Vous y trouverez le statut en temps réel. Un email de confirmation vous a été envoyé à la validation.',
  },
  {
    triggers: ['stock', 'disponible', 'rupture', 'quand disponible'],
    answer: 'La disponibilité est affichée sur chaque fiche produit. En cas de rupture, vous pouvez nous contacter pour être alerté à la remise en stock.',
  },
  {
    triggers: ['paiement', 'carte', 'sécuri', 'paypal', 'virement'],
    answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard) et PayPal. Toutes les transactions sont sécurisées. Nous ne stockons jamais vos données bancaires.',
  },
  {
    triggers: ['mot de passe', 'compte', 'connexion', 'identifiant', 'email'],
    answer: 'Si vous avez oublié votre mot de passe, utilisez la page « Mot de passe oublié » sur l\'écran de connexion. Un lien de réinitialisation vous sera envoyé par email.',
  },
  {
    triggers: ['garantie', 'sav', 'panne', 'défaut', 'cassé'],
    answer: 'Nos produits bénéficient d\'une garantie légale de 2 ans. En cas de panne ou de défaut, contactez notre SAV via ce formulaire avec photos et description du problème.',
  },
  {
    triggers: ['facture', 'reçu', 'document'],
    answer: 'Votre facture est disponible dans votre espace compte, rubrique historique des commandes. Vous pouvez la télécharger en PDF.',
  },
];

const SUGGESTIONS = [
  'Délais de livraison ?',
  'Faire un retour ?',
  'Suivre ma commande',
  'Problème de paiement',
];

const BOT_INTRO = 'Bonjour ! Je suis l\'assistant Althea. Posez-moi une question sur la livraison, les retours, votre commande ou le SAV.';

function findAnswer(input) {
  const q = input.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  for (const entry of FAQ) {
    if (entry.triggers.some((t) => q.includes(t.normalize('NFD').replace(/\p{Diacritic}/gu, '')))) {
      return entry.answer;
    }
  }
  return 'Je n\'ai pas trouvé de réponse précise à votre question. Utilisez le formulaire ci-contre pour contacter notre équipe qui vous répondra sous 24 h.';
}

function Chatbot() {
  const [messages, setMessages] = useState([{ id: 0, role: 'bot', text: BOT_INTRO }]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text) => {
    const question = text.trim();
    if (!question) return;
    const answer = findAnswer(question);
    setMessages((prev) => [
      ...prev,
      { id: prev.length, role: 'user', text: question },
      { id: prev.length + 1, role: 'bot', text: answer },
    ]);
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <aside className="chatbot" aria-label="Assistant virtuel">
      <div className="chatbot__header">
        <span className="chatbot__dot" aria-hidden="true" />
        <h3>Assistant Althea</h3>
      </div>

      <div className="chatbot__messages" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div key={msg.id} className={`chatbot__bubble chatbot__bubble--${msg.role}`}>
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chatbot__suggestions" aria-label="Questions fréquentes">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chatbot__suggestion" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <form className="chatbot__form" onSubmit={handleSubmit}>
        <input
          className="chatbot__input"
          type="text"
          placeholder="Posez votre question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Votre question"
        />
        <button type="submit" className="chatbot__send" aria-label="Envoyer">➤</button>
      </form>
    </aside>
  );
}

function validateForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Votre nom est requis.';
  }

  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Adresse e-mail invalide.';
  }

  if (!form.message.trim() || form.message.trim().length < 10) {
    errors.message = 'Message trop court (10 caractères minimum).';
  }

  return errors;
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'support', message: '' });
  const [errors, setErrors] = useState({});
  const [messageSent, setMessageSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    setServerError('');

    try {
      await apiClient.post('/pg/support/contact', {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      setMessageSent(true);
    } catch (err) {
      setServerError(err.message || 'Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (messageSent) {
    return (
      <section className="page contact-page">
        <output className="notice notice--success">
          <strong>Message envoyé !</strong> Nous vous répondrons sous 24 h à l&apos;adresse {form.email}.
        </output>
        <div className="page-actions">
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => {
              setForm({ name: '', email: '', subject: 'support', message: '' });
              setMessageSent(false);
            }}
          >
            Envoyer un autre message
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page contact-page">
      <header className="page__header">
        <h1 className="page__title">Contact & Assistance</h1>
        <p className="page__subtitle">Notre équipe vous répond sous 24 h.</p>
      </header>

      <div className="contact-layout">
        <form className="contact-form stack" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="contact-name" className="form-label">
              Nom complet <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-name"
              className={`input${errors.name ? ' input--error' : ''}`}
              placeholder="Votre nom"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            {errors.name ? (
              <p className="helper-text helper-text--error" role="alert">{errors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="contact-email" className="form-label">
              Adresse e-mail <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-email"
              className={`input${errors.email ? ' input--error' : ''}`}
              type="email"
              placeholder="votre@email.fr"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            {errors.email ? (
              <p className="helper-text helper-text--error" role="alert">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="contact-subject" className="form-label">Sujet</label>
            <select
              id="contact-subject"
              className="select"
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
            >
              <option value="support">Support technique</option>
              <option value="commercial">Demande commerciale</option>
              <option value="commande">Suivi de commande</option>
            </select>
          </div>

          <div>
            <label htmlFor="contact-message" className="form-label">
              Message <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="contact-message"
              className={`textarea${errors.message ? ' input--error' : ''}`}
              rows="6"
              placeholder="Décrivez votre demande (10 caractères minimum)…"
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
            {errors.message ? (
              <p className="helper-text helper-text--error" role="alert">{errors.message}</p>
            ) : null}
          </div>

          {serverError ? (
            <p className="helper-text helper-text--error" role="alert">{serverError}</p>
          ) : null}

          <button className="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : 'Envoyer'}
          </button>
        </form>

        <Chatbot />
      </div>
    </section>
  );
}
