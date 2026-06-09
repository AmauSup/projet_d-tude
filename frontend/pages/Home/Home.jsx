import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './Home.css';
import { formatPrice } from '../../utils/storefront.js';

const slideShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  badge: PropTypes.string,
  title: PropTypes.string,
  text: PropTypes.string,
  ctaLabel: PropTypes.string,
  categorySlug: PropTypes.string,
});

Carousel.propTypes = {
  slides: PropTypes.arrayOf(slideShape).isRequired,
  onOpenCategory: PropTypes.func.isRequired,
};

function Carousel({ slides, onOpenCategory }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1)), [slides.length]);
  const next = useCallback(() => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1)), [slides.length]);

  // Swipe tactile
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff < -40) next();
    else if (diff > 40) prev();
    touchStartX.current = null;
  };

  // Auto-avance toutes les 5 secondes
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, slides.length]);

  if (!slides.length) return null;
  const slide = slides[current];

  return (
    <div
      className="home-carousel-wrapper"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carrousel"
      aria-label="Promotions"
    >
      <div className="home-slide home-slide--single">
        {slide.imageUrl && (
          <img className="home-slide__img" src={slide.imageUrl} alt="" aria-hidden="true" />
        )}
        <div className="home-slide__content">
          <span className="badge">{slide.badge}</span>
          <h3>{slide.title}</h3>
          <p>{slide.text}</p>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => onOpenCategory(slide.categorySlug)}
          >
            {slide.ctaLabel}
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-arrow--prev"
            onClick={prev}
            aria-label="Diapositive précédente"
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow--next"
            onClick={next}
            aria-label="Diapositive suivante"
          >
            ›
          </button>
          <div className="carousel-dots" role="tablist" aria-label="Diapositives">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Diapositive ${i + 1}`}
                className={`carousel-dot ${i === current ? 'is-active' : ''}`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

Home.propTypes = {
  homeContent: PropTypes.shape({
    carousel: PropTypes.arrayOf(slideShape),
    fixedMessage: PropTypes.string,
  }).isRequired,
  categories: PropTypes.array,
  featuredProducts: PropTypes.array,
  onOpenCategory: PropTypes.func.isRequired,
  onOpenProduct: PropTypes.func.isRequired,
};

export default function Home({
  homeContent,
  categories = [],
  featuredProducts = [],
  onOpenCategory,
  onOpenProduct,
}) {
  return (
    <section className="page home-page">
      <header className="page__header">
        <h1 className="page__title">Bienvenue sur Althea Medical</h1>
        <p className="page__subtitle">
          Équipements médicaux certifiés pour cabinets, cliniques et structures hospitalières.
        </p>
      </header>

      <Carousel slides={homeContent.carousel} onOpenCategory={onOpenCategory} />

      <div className="notice notice--info home-fixed-message">
        {homeContent.fixedMessage}
      </div>

      <section className="home-section">
        <h2>Catégories populaires</h2>
        <div className="card-grid">
          {categories.slice(0, 6).map((category) => (
            <article className="card home-card" key={category.id}>
              {category.imageUrl ? (
                <img className="card__image" src={category.imageUrl} alt={category.name} />
              ) : (
                <div className="card__image" />
              )}
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => onOpenCategory(category.slug)}
              >
                Voir la catégorie
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>Top produits du moment</h2>
        <div className="card-grid">
          {featuredProducts.slice(0, 6).map((product) => (
            <article className="card home-card" key={product.id}>
              {product.image ? (
                <img className="card__image" src={product.image} alt={product.name} />
              ) : (
                <div className="card__image" />
              )}
              <h3>{product.name}</h3>
              <p>{product.shortDescription}</p>
              <p className="home-price">{formatPrice(product.priceCents)}</p>
              <div className="inline-actions">
                <span
                  className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}
                >
                  {product.availableStock > 0 ? 'En stock' : 'Rupture de stock'}
                </span>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => onOpenProduct(product.slug)}
                >
                  Voir la fiche
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
