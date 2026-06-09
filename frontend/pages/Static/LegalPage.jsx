import React from 'react';

export default function LegalPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Mentions légales</h1>
        <p className="page__subtitle">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.</p>
      </header>

      <div className="stack" style={{ maxWidth: 800, lineHeight: 1.7 }}>
        <article className="card stack">
          <h2>Éditeur du site</h2>
          <p><strong>Althea Systems SAS</strong></p>
          <p>Société par Actions Simplifiée au capital de 50 000 €</p>
          <p>RCS Paris — SIRET : 123 456 789 00012</p>
          <p>Siège social : 12 rue de la Santé, 75005 Paris, France</p>
          <p>Téléphone : +33 (0)1 23 45 67 89</p>
          <p>E-mail : <a href="mailto:contact@althea-systems.com">contact@althea-systems.com</a></p>
          <p>Directeur de la publication : Direction Générale d'Althea Systems</p>
        </article>

        <article className="card stack">
          <h2>Hébergement</h2>
          <p>Le site est hébergé par :</p>
          <p><strong>Vercel Inc.</strong></p>
          <p>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
          <p>Site : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a></p>
          <p>Base de données hébergée par <strong>Neon Technologies Inc.</strong> (infrastructure PostgreSQL serverless).</p>
        </article>

        <article className="card stack">
          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments composant ce site (textes, graphismes, logiciels, images, sons, vidéos,
            logo, architecture) sont la propriété exclusive d'Althea Systems ou de ses partenaires et sont
            protégés par les dispositions du Code de la Propriété Intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification, publication ou transmission de tout ou partie
            des éléments du site, par quelque moyen que ce soit, sans l'autorisation écrite préalable
            d'Althea Systems, est interdite.
          </p>
        </article>

        <article className="card stack">
          <h2>Données personnelles et RGPD</h2>
          <p>
            Althea Systems traite vos données personnelles en qualité de responsable du traitement,
            conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés.
          </p>
          <p><strong>Données collectées :</strong> nom, prénom, adresse e-mail, adresse postale,
          historique de commandes, données de navigation.</p>
          <p><strong>Finalités :</strong> gestion des commandes, communication transactionnelle,
          amélioration du service.</p>
          <p><strong>Durée de conservation :</strong> 3 ans à compter du dernier achat ou de la
          fermeture du compte.</p>
          <p>
            Conformément à la réglementation, vous disposez de droits d'accès, de rectification,
            d'effacement, de portabilité et d'opposition. Pour exercer ces droits :{' '}
            <a href="mailto:privacy@althea-systems.com">privacy@althea-systems.com</a>
          </p>
          <p>
            Vous pouvez également adresser une réclamation à la CNIL :{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
          </p>
        </article>

        <article className="card stack">
          <h2>Cookies</h2>
          <p>
            Ce site utilise des cookies fonctionnels pour maintenir votre session et mémoriser vos
            préférences (langue, panier). Aucun cookie publicitaire ou de suivi tiers n'est déposé sans
            votre consentement explicite.
          </p>
        </article>

        <article className="card stack">
          <h2>Liens hypertextes</h2>
          <p>
            Althea Systems ne peut être tenue responsable du contenu des sites tiers vers lesquels des
            liens sont proposés. La création de liens pointant vers le site althea-systems.com est soumise
            à autorisation préalable écrite.
          </p>
        </article>

        <article className="card stack">
          <h2>Droit applicable et juridiction compétente</h2>
          <p>
            Les présentes mentions légales sont régies par le droit français. En cas de litige, et après
            tentative de résolution amiable, les tribunaux compétents de Paris seront seuls compétents.
          </p>
        </article>
      </div>
    </section>
  );
}
