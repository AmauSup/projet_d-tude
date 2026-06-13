import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Product.css';
import { formatPrice } from '../../utils/storefront.js';
import { useI18n } from '../../contexts/I18nContext.jsx';
import ImageWithLoader from '../../components/common/ImageWithLoader.jsx';

function ImageCarousel({ images, name }) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className="product-main-image" aria-label={`Image de ${name}`} />;
  }

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="product-gallery">
      <div className="product-carousel">
        <ImageWithLoader
          className="product-carousel__main"
          src={images[index]}
          alt={`${name} — vue ${index + 1}`}
        />
        {images.length > 1 && (
          <>
            <button type="button" className="carousel-arrow carousel-arrow--prev" onClick={prev} aria-label="Image précédente">‹</button>
            <button type="button" className="carousel-arrow carousel-arrow--next" onClick={next} aria-label="Image suivante">›</button>
            <div className="product-carousel__thumbs">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`product-carousel__thumb ${i === index ? 'is-active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Vue ${i + 1}`}
                  aria-pressed={i === index}
                >
                  <ImageWithLoader src={src} alt="" style={{ width: '100%', height: '100%' }} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

ImageCarousel.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  name: PropTypes.string,
};

Product.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    shortDescription: PropTypes.string,
    priceCents: PropTypes.number,
    availableStock: PropTypes.number,
    technicalFeatures: PropTypes.arrayOf(PropTypes.string),
    images: PropTypes.arrayOf(PropTypes.string),
    image: PropTypes.string,
    slug: PropTypes.string,
  }),
  relatedProducts: PropTypes.array,
  onAddToCart: PropTypes.func.isRequired,
  onBuyNow: PropTypes.func.isRequired,
  onOpenProduct: PropTypes.func.isRequired,
};

export default function Product({
  product,
  relatedProducts = [],
  onAddToCart,
  onBuyNow,
  onOpenProduct,
}) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const isAvailable = useMemo(() => product?.availableStock > 0, [product]);

  const images = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (product.image) return [product.image];
    return [];
  }, [product]);

  if (!product) {
    return (
      <section className="page product-page">
        <p>{t('product.notSelected')}</p>
      </section>
    );
  }

  return (
    <section className="page product-page">
      <div className="product-layout">
        <ImageCarousel images={images} name={product.name} />

        <div className="product-info">
          <span className="badge">{t('product.badge')}</span>
          <h1 className="page__title">{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <p className="product-price">{formatPrice(product.priceCents)}</p>

          <p>
            {t('product.availability')}{' '}
            <strong>
              {isAvailable
                ? `${product.availableStock} ${t('product.available')}`
                : t('product.outOfStock')}
            </strong>
          </p>

          <article className="panel">
            <h3>{t('product.technicalFeatures')}</h3>
            <ul className="product-features">
              {(product.technicalFeatures || []).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>

          <div className="product-cta">
            <input
              className="input"
              type="number"
              min="1"
              max={product.availableStock || 1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value), product.availableStock || 1)))}
              disabled={!isAvailable}
              style={{ width: 72 }}
              aria-label="Quantité"
            />
            <button
              className="btn btn--primary"
              type="button"
              disabled={!isAvailable}
              onClick={() => onAddToCart(product.id, quantity)}
            >
              {isAvailable ? t('product.addToCart') : t('product.outOfStock')}
            </button>

            <button
              className="btn btn--secondary"
              type="button"
              disabled={!isAvailable}
              onClick={() => { onAddToCart(product.id, quantity); onBuyNow(product.id); }}
            >
              {t('product.buyNow')}
            </button>
          </div>
        </div>
      </div>

      <section className="home-section product-related">
        <h2>{t('product.relatedProducts')}</h2>
        <div className="card-grid">
          {relatedProducts.map((relatedProduct) => (
            <article className="card" key={relatedProduct.id}>
              <ImageWithLoader className="card__image" src={relatedProduct.image} alt={relatedProduct.name} />
              <h3>{relatedProduct.name}</h3>
              <p>{relatedProduct.shortDescription}</p>
              <strong>{formatPrice(relatedProduct.priceCents)}</strong>
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => onOpenProduct(relatedProduct.slug)}
              >
                {t('product.viewProduct')}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
