import React, { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, IconButton, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '../contexts/AuthContext';
import ProductForm from '../components/ProductForm';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/pg/admin/products'),
      apiFetch('/pg/admin/categories'),
      apiFetch('/pg/admin/languages').catch(() => ({ languages: [{ id: 1, code: 'fr', name: 'Français' }] })),
    ])
      .then(([pData, cData, lData]) => {
        setProducts(pData.products || []);
        setCategories(cData.categories || []);
        setLanguages(lData.languages || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAddProduct = async (data) => {
    setSaving(true);
    try {
      await apiFetch('/pg/admin/products', { method: 'POST', body: JSON.stringify(data) });
      setOpenAdd(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = async (data) => {
    setSaving(true);
    try {
      await apiFetch(`/pg/admin/products/${editData.id}`, { method: 'PUT', body: JSON.stringify(data) });
      setOpenEdit(false);
      setEditData(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    setSaving(true);
    try {
      await apiFetch(`/pg/admin/products/${deleteId}`, { method: 'DELETE' });
      setOpenDelete(false);
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

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

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

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
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">Aucun produit.</Typography>
                </TableCell>
              </TableRow>
            )}
            {products.map((prod) => (
              <TableRow key={prod.id}>
                <TableCell>{prod.id}</TableCell>
                <TableCell>{prod.name || prod.name_fr || '—'}</TableCell>
                <TableCell>{prod.category_name || prod.category || '—'}</TableCell>
                <TableCell>{Number(prod.price).toFixed(2)} €</TableCell>
                <TableCell>{prod.stock}</TableCell>
                <TableCell>{prod.updated_at ? String(prod.updated_at).slice(0, 10) : '—'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                    onClick={() => {
                      setEditData({
                        ...prod,
                        translations: languages.map((l) => ({
                          language_id: l.id,
                          name: prod.name || '',
                          description: prod.description || '',
                          characteristics: prod.characteristics || '',
                        })),
                        category_id: prod.category_id || '',
                      });
                      setOpenEdit(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => { setDeleteId(prod.id); setOpenDelete(true); }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ProductForm
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleAddProduct}
        categories={categories}
        languages={languages}
        loading={saving}
      />

      <ProductForm
        open={openEdit}
        onClose={() => { setOpenEdit(false); setEditData(null); }}
        onSubmit={handleEditProduct}
        initialData={editData}
        categories={categories}
        languages={languages}
        loading={saving}
      />

      {openDelete && (
        <Paper elevation={6} sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="h6" gutterBottom>Confirmer la suppression</Typography>
            <Typography>Voulez-vous vraiment supprimer ce produit ?</Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => { setOpenDelete(false); setDeleteId(null); }} disabled={saving}>Annuler</Button>
              <Button variant="contained" color="error" onClick={handleDeleteProduct} disabled={saving}>
                {saving ? <CircularProgress size={18} color="inherit" /> : 'Supprimer'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
