

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ProductForm from '../components/ProductForm';

// Données factices pour la maquette
const fakeProducts = [
  { id: 1, name: 'Produit 1', price: 19.99, stock: 10, category: 'Catégorie A', updated_at: '2026-04-25' },
  { id: 2, name: 'Produit 2', price: 29.99, stock: 5, category: 'Catégorie B', updated_at: '2026-04-24' },
];
const fakeCategories = [
  { id: 1, name: 'Catégorie A' },
  { id: 2, name: 'Catégorie B' },
];
const fakeLanguages = [
  { id: 1, name: 'Français' },
  { id: 2, name: 'English' },
];

export default function Products() {
  const [products, setProducts] = useState(fakeProducts);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Ajout produit (mock, à remplacer par appel API)
  const handleAddProduct = (data) => {
    setProducts((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: data.translations[0]?.name || 'Nouveau produit',
        price: data.price,
        stock: data.stock,
        category: fakeCategories.find(c => c.id === Number(data.category_id))?.name || '',
        updated_at: new Date().toISOString().slice(0, 10),
      },
    ]);
    setOpenAdd(false);
  };

  // Edition produit (mock, à remplacer par appel API)
  const handleEditProduct = (data) => {
    setProducts((prev) => prev.map(p =>
      p.id === editData.id
        ? {
            ...p,
            name: data.translations[0]?.name || p.name,
            price: data.price,
            stock: data.stock,
            category: fakeCategories.find(c => c.id === Number(data.category_id))?.name || p.category,
            updated_at: new Date().toISOString().slice(0, 10),
          }
        : p
    ));
    setOpenEdit(false);
    setEditData(null);
  };

  // Suppression produit (mock, à remplacer par appel API)
  const handleDeleteProduct = () => {
    setProducts((prev) => prev.filter(p => p.id !== deleteId));
    setOpenDelete(false);
    setDeleteId(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="h4">Gestion des produits</Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
            Ajouter un produit
          </Button>
        </Grid>
      </Grid>

      {/* TODO: Filtres de recherche (nom, catégorie, langue, etc.) */}
      <Box sx={{ mb: 2, color: '#888' }}>À compléter (filtres de recherche)</Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Dernière modif.</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((prod) => (
              <TableRow key={prod.id}>
                <TableCell>{prod.id}</TableCell>
                <TableCell>{prod.name}</TableCell>
                <TableCell>{prod.category}</TableCell>
                <TableCell>{prod.price} €</TableCell>
                <TableCell>{prod.stock}</TableCell>
                <TableCell>{prod.updated_at}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                    onClick={() => {
                      setEditData({
                        ...prod,
                        // Pour le mock, on ne gère pas les traductions réelles ici
                        translations: fakeLanguages.map(l => ({ language_id: l.id, name: prod.name, description: '', characteristics: '' })),
                        category_id: fakeCategories.find(c => c.name === prod.category)?.id || '',
                      });
                      setOpenEdit(true);
                    }}
                  >
                    <span role="img" aria-label="edit">✏️</span>
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleteId(prod.id);
                      setOpenDelete(true);
                    }}
                  >
                    <span role="img" aria-label="delete">🗑️</span>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal ajout produit */}
      <ProductForm
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleAddProduct}
        categories={fakeCategories}
        languages={fakeLanguages}
      />

      {/* Modal édition produit */}
      <ProductForm
        open={openEdit}
        onClose={() => { setOpenEdit(false); setEditData(null); }}
        onSubmit={handleEditProduct}
        initialData={editData}
        categories={fakeCategories}
        languages={fakeLanguages}
      />

      {/* Modal suppression produit */}
      {openDelete && (
        <Paper elevation={6} sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="h6" gutterBottom>Confirmer la suppression</Typography>
            <Typography>Voulez-vous vraiment supprimer ce produit ?</Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => { setOpenDelete(false); setDeleteId(null); }}>Annuler</Button>
              <Button variant="contained" color="error" onClick={handleDeleteProduct}>Supprimer</Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
