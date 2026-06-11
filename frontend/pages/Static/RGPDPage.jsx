import React from 'react';

export default function RGPDPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Politique de protection des données (RGPD)</h1>
        <p className="page__subtitle">Dernière mise à jour : janvier 2026</p>
      </header>

      <div className="stack" style={{ maxWidth: 800, lineHeight: 1.7 }}>
        <article className="card stack">
          <h2>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données personnelles collectées sur le site <strong>Althea Systems</strong> est :
          </p>
          <p>
            <strong>Althea Systems SAS</strong><br />
            12 rue de la Santé, 75005 Paris, France<br />
            E-mail : <strong>privacy@althea-systems.com</strong><br />
            Délégué à la Protection des Données (DPO) : dpo@althea-systems.com
          </p>
        </article>

        <article className="card stack">
          <h2>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Données d'identification</strong> : prénom, nom, adresse e-mail, société</li>
            <li><strong>Données de commande</strong> : adresse de facturation, historique d'achat, récapitulatif de paiement (4 derniers chiffres de carte uniquement)</li>
            <li><strong>Données de connexion</strong> : adresse IP, logs d'accès, tokens JWT (durée de vie limitée)</li>
            <li><strong>Préférences</strong> : langue d'affichage, thème (clair/sombre), panier en attente</li>
          </ul>
          <p>
            Nous ne collectons <strong>jamais</strong> de numéros de carte bancaire complets. Les paiements
            transitent par un prestataire sécurisé certifié PCI-DSS.
          </p>
        </article>

        <article className="card stack">
          <h2>3. Finalités du traitement</h2>
          <p>Vos données sont traitées pour :</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>La gestion de votre compte client et l'authentification sécurisée</li>
            <li>Le traitement et le suivi de vos commandes</li>
            <li>La génération et la transmission de vos factures</li>
            <li>La communication transactionnelle (confirmation de commande, vérification d'e-mail)</li>
            <li>La prévention de la fraude et la sécurité du site</li>
            <li>Le respect de nos obligations légales et comptables</li>
          </ul>
          <p>
            Nous n'utilisons pas vos données à des fins de prospection commerciale sans votre consentement
            préalable.
          </p>
        </article>

        <article className="card stack">
          <h2>4. Base légale du traitement</h2>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Exécution d'un contrat</strong> : traitement des commandes, gestion du compte</li>
            <li><strong>Obligation légale</strong> : conservation des factures (10 ans)</li>
            <li><strong>Intérêt légitime</strong> : sécurité du site, prévention de la fraude</li>
            <li><strong>Consentement</strong> : communications optionnelles, cookies non essentiels</li>
          </ul>
        </article>

        <article className="card stack">
          <h2>5. Durée de conservation</h2>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Données de compte</strong> : pendant la durée d'activité du compte + 3 ans après la dernière connexion</li>
            <li><strong>Commandes et factures</strong> : 10 ans (obligation légale comptable)</li>
            <li><strong>Logs de sécurité</strong> : 12 mois</li>
            <li><strong>Tokens de vérification</strong> : 72 heures</li>
            <li><strong>Panier</strong> : jusqu'à la fermeture de session ou validation de commande</li>
          </ul>
        </article>

        <article className="card stack">
          <h2>6. Partage des données</h2>
          <p>
            Vos données peuvent être partagées avec :
          </p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Notre prestataire d'hébergement et de base de données (Neon / AWS, Union Européenne)</li>
            <li>Notre prestataire de paiement (données de paiement uniquement)</li>
            <li>Les autorités fiscales et judiciaires sur réquisition légale</li>
          </ul>
          <p>
            Aucune donnée n'est vendue ni cédée à des tiers à des fins commerciales.
          </p>
        </article>

        <article className="card stack">
          <h2>7. Vos droits</h2>
          <p>Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
            <li><strong>Droit à l'effacement</strong> (« droit à l'oubli ») : supprimer votre compte et vos données</li>
            <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition</strong> : vous opposer à certains traitements</li>
            <li><strong>Droit à la limitation</strong> : limiter le traitement de vos données</li>
          </ul>
        </article>

        <article className="card stack">
          <h2>8. Exercer vos droits</h2>
          <p>
            Pour exercer vos droits ou supprimer votre compte, vous pouvez :
          </p>
          <ul style={{ paddingLeft: 20 }}>
            <li>
              <strong>Supprimer votre compte directement</strong> depuis votre espace compte →{' '}
              Paramètres → « Supprimer mon compte »
            </li>
            <li>
              <strong>Contacter notre DPO</strong> : privacy@althea-systems.com (réponse sous 30 jours)
            </li>
          </ul>
          <p>
            En cas de litige, vous pouvez introduire une réclamation auprès de la{' '}
            <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) :{' '}
            <strong>www.cnil.fr</strong>.
          </p>
        </article>

        <article className="card stack">
          <h2>9. Sécurité des données</h2>
          <p>
            Nous mettons en œuvre les mesures de sécurité suivantes :
          </p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Chiffrement des mots de passe (bcrypt, facteur 12)</li>
            <li>Authentification par token JWT à durée limitée</li>
            <li>Double authentification (2FA) pour les comptes administrateurs</li>
            <li>Connexions chiffrées (HTTPS/TLS) avec l'ensemble de nos services</li>
            <li>En-têtes de sécurité HTTP (X-Frame-Options, X-Content-Type-Options, CSP)</li>
            <li>Rate limiting sur les endpoints sensibles (connexion, inscription, réinitialisation)</li>
          </ul>
        </article>

        <article className="card stack">
          <h2>10. Cookies</h2>
          <p>
            Ce site utilise uniquement des cookies <strong>fonctionnels strictement nécessaires</strong> :
          </p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Token d'authentification (localStorage/sessionStorage) — nécessaire à votre connexion</li>
            <li>Préférences de langue et de thème — améliorent votre expérience sans suivi</li>
            <li>Panier — conservé localement sur votre appareil</li>
          </ul>
          <p>
            Aucun cookie publicitaire ni traceur tiers n'est utilisé sur ce site.
          </p>
        </article>

        <article className="card stack">
          <h2>11. Contact</h2>
          <p>
            Pour toute question relative à la protection de vos données :<br />
            <strong>privacy@althea-systems.com</strong><br />
            Althea Systems SAS — 12 rue de la Santé, 75005 Paris, France
          </p>
        </article>
      </div>
    </section>
  );
}
