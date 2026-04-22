import React from 'react';

export default function AlertMessage({ type = 'info', children }) {
  const cssClass = `notice notice--${type}`;
  return <div className={cssClass} role="alert">{children}</div>;
}
