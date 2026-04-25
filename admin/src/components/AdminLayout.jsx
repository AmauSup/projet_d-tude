import React from 'react';
import Sidebar from './Sidebar';
import Notifications from './Notifications';
import Breadcrumbs from './Breadcrumbs';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <Breadcrumbs />
        <Notifications />
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
