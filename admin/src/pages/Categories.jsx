
import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CategoryForm from '../components/CategoryForm';
// TODO: Connecter à l'API/backend pour charger les catégories

// Données factices pour la maquette
const fakeCategories = [
  { id: 1, name: 'Catégorie A' },
  { id: 2, name: 'Catégorie B' },
];

export default function Categories() {
  const [categories, setCategories] = useState(fakeCategories);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Ajout catégorie (mock)
  const handleAddCategory = (data) => {
    setCategories((prev) => [
      ...prev,
      { id: prev.length + 1, name: data.name },
    ]);
    setOpenAdd(false);
  };

  // Edition catégorie (mock)
  const handleEditCategory = (data) => {
    setCategories((prev) => prev.map(c =>
      c.id === editData.id ? { ...c, name: data.name } : c
    ));
    setOpenEdit(false);
    setEditData(null);
  };

  // Suppression catégorie (mock)
  const handleDeleteCategory = () => {
    setCategories((prev) => prev.filter(c => c.id !== deleteId));
    setOpenDelete(false);
    setDeleteId(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="h4">Gestion des catégories</Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
            Ajouter une catégorie
          </Button>
        </Grid>
      </Grid>

      {/* TODO: Filtres de recherche (nom, etc.) */}
      <Box sx={{ mb: 2, color: '#888' }}>À compléter (filtres de recherche)</Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.id}</TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                    onClick={() => {
                      setEditData(cat);
                      setOpenEdit(true);
                    }}
                  >
                    <span role="img" aria-label="edit">✏️</span>
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleteId(cat.id);
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

      {/* Modal ajout catégorie */}
      <CategoryForm
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleAddCategory}
      />

      {/* Modal édition catégorie */}
      <CategoryForm
        open={openEdit}
        onClose={() => { setOpenEdit(false); setEditData(null); }}
        onSubmit={handleEditCategory}
        initialData={editData}
      />

      {/* Modal suppression catégorie */}
      {openDelete && (
        <Paper elevation={6} sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="h6" gutterBottom>Confirmer la suppression</Typography>
            <Typography>Voulez-vous vraiment supprimer cette catégorie ?</Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => { setOpenDelete(false); setDeleteId(null); }}>Annuler</Button>
              <Button variant="contained" color="error" onClick={handleDeleteCategory}>Supprimer</Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
