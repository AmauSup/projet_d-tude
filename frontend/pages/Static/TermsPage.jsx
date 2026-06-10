import React from 'react';

export default function TermsPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Conditions Générales d'Utilisation</h1>
        <p className="page__subtitle">Dernière mise à jour : janvier 2026</p>
      </header>

      <div className="stack" style={{ maxWidth: 800, lineHeight: 1.7 }}>
        <article className="card stack">
          <h2>1. Objet</h2>
          <p>
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du site
            e-commerce <strong>Althea Systems</strong>, accessible à l'adresse althea-systems.com, opéré par
            la société Althea Systems SAS, spécialisée dans la distribution de matériel médical de pointe à
            destination des professionnels de santé (cabinets médicaux, cliniques, structures hospitalières).
          </p>
        </article>

        <article className="card stack">
          <h2>2. Acceptation des conditions</h2>
          <p>
            Toute navigation sur le site ou toute passation de commande implique l'acceptation pleine et
            entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le site.
          </p>
        </article>

        <article className="card stack">
          <h2>3. Accès au site et création de compte</h2>
          <p>
            Le site est accessible 24h/24, 7j/7, sous réserve d'opérations de maintenance ou d'incidents
            techniques. La création d'un compte requiert une adresse e-mail valide, un mot de passe sécurisé
            (8 caractères minimum, majuscule, minuscule, chiffre et caractère spécial) et la vérification de
            votre adresse e-mail via un lien envoyé automatiquement. Vous êtes responsable de la
            confidentialité de vos identifiants.
          </p>
        </article>

        <article className="card stack">
          <h2>4. Produits et disponibilité</h2>
          <p>
            Les produits présentés sont des dispositifs médicaux à usage professionnel. Les informations
            (descriptions, prix, disponibilités) sont mises à jour régulièrement mais peuvent être modifiées
            sans préavis. Althea Systems se réserve le droit d'annuler une commande en cas d'erreur de prix
            manifeste ou d'indisponibilité de stock confirmée.
          </p>
        </article>

        <article className="card stack">
          <h2>5. Commandes et paiement</h2>
          <p>
            Toute commande passée sur le site constitue un contrat de vente entre l'acheteur et Althea Systems.
            Le paiement s'effectue par carte bancaire via un prestataire sécurisé. Seuls les 4 derniers
            chiffres de la carte sont conservés. Un e-mail de confirmation est adressé après chaque commande
            validée. La facture PDF est disponible dans votre espace compte.
          </p>
        </article>

        <article className="card stack">
          <h2>6. Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu du site (textes, images, logos, structure) est la propriété exclusive
            d'Althea Systems et est protégé par le droit d'auteur. Toute reproduction, distribution ou
            utilisation commerciale sans autorisation écrite préalable est strictement interdite.
          </p>
        </article>

        <article className="card stack">
          <h2>7. Données personnelles</h2>
          <p>
            Althea Systems collecte et traite vos données personnelles conformément au Règlement Général sur
            la Protection des Données (RGPD). Vos données sont utilisées exclusivement pour le traitement
            de vos commandes, la gestion de votre compte et la communication liée à vos achats. Vous
            disposez d'un droit d'accès, de rectification et de suppression. Pour toute demande :
            privacy@althea-systems.com.
          </p>
        </article>

        <article className="card stack">
          <h2>8. Responsabilité</h2>
          <p>
            Althea Systems ne pourra être tenue responsable des dommages indirects résultant de l'utilisation
            du site. Les produits vendus sont conformes aux normes CE applicables. L'utilisation des
            dispositifs médicaux relève de la responsabilité des professionnels de santé habilités.
          </p>
        </article>

        <article className="card stack">
          <h2>9. Droit applicable</h2>
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera
            recherchée en priorité. À défaut, les tribunaux compétents de Paris seront saisis.
          </p>
        </article>

        <article className="card stack">
          <h2>10. Contact</h2>
          <p>
            Pour toute question relative aux présentes CGU : <strong>legal@althea-systems.com</strong> —
            Althea Systems SAS, 12 rue de la Santé, 75005 Paris, France.
          </p>
        </article>
      </div>
    </section>
  );
}
