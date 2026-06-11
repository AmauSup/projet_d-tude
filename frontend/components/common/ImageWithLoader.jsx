import React, { useState } from 'react';

export default function ImageWithLoader({ src, alt = '', className = '', style }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const hasImage = src && !error;

  return (
    <div className={`img-loader-wrap${className ? ` ${className}` : ''}`} style={style}>
      {hasImage && (
        <>
          {!loaded && <span className="img-loader__spinner" aria-hidden="true" />}
          <img
            src={src}
            alt={alt}
            className={`img-loader__img${loaded ? ' is-loaded' : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        </>
      )}
    </div>
  );
}
