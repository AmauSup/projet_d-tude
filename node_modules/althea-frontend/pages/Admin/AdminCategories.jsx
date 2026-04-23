import React from 'react';

export default function AdminCategories({ categories = [], onSetCategoryOrder }) {
  return (
    <article className="card stack">
      <h2>Gestion des catégories</h2>
      <span className="helper-text">{categories.length} catégorie(s)</span>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Ordre d'affichage</th>
            </tr>
          </thead>
          <tbody>
            {[...categories]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((category) => (
                <tr key={category.id}>
                  <td><strong>{category.name}</strong></td>
                  <td><span className="helper-text">{category.slug}</span></td>
                  <td>{category.description}</td>
                  <td>
                    <input
                      className="input"
                      style={{ width: '5rem' }}
                      type="number"
                      min="1"
                      value={category.displayOrder}
                      onChange={(e) => onSetCategoryOrder(category.id, e.target.value)}
                      aria-label={`Ordre de la catégorie ${category.name}`}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="notice notice--info">
        Backend hook : la création et suppression de catégories, ainsi que la gestion des images, nécessitent une API connectée.
      </div>
    </article>
  );
}
