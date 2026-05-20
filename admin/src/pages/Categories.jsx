import React, { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, IconButton, Alert,
  CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '../contexts/AuthContext';

function CategoryDialog({ open, onClose, onSubmit, initialData, loading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setImageUrl(initialData?.image_url || '');
      setOrderIndex(initialData?.order_index ?? 0);
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description, image_url: imageUrl, order_index: Number(orderIndex) });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initialData ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</DialogTitle>
        <DialogContent dividers>
          <TextField label="Nom *" value={name} onChange={(e) => setName(e.target.value)} fullWidth margin="dense" required />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth margin="dense" multiline rows={2} />
          <TextField label="URL image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} fullWidth margin="dense" />
          <TextField label="Ordre d'affichage" type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading || !name.trim()}>
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    apiFetch('/pg/admin/categories')
      .then((data) => setCategories(data.categories || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await apiFetch('/pg/admin/categories', { method: 'POST', body: JSON.stringify(data) });
      setOpenAdd(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      await apiFetch(`/pg/admin/categories/${editData.id}`, { method: 'PUT', body: JSON.stringify(data) });
      setOpenEdit(false);
      setEditData(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await apiFetch(`/pg/admin/categories/${deleteId}`, { method: 'DELETE' });
      setOpenDelete(false);
      setDeleteId(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid item><Typography variant="h4">Gestion des catégories</Typography></Grid>
        <Grid item>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
            Ajouter une catégorie
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
              <TableCell>Slug</TableCell>
              <TableCell>Ordre</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">Aucune catégorie.</Typography>
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.id}</TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{cat.slug}</TableCell>
                <TableCell>{cat.order_index ?? 0}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" sx={{ mr: 0.5 }}
                    onClick={() => { setEditData(cat); setOpenEdit(true); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error"
                    onClick={() => { setDeleteId(cat.id); setOpenDelete(true); }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CategoryDialog open={openAdd} onClose={() => setOpenAdd(false)} onSubmit={handleAdd} loading={saving} />
      <CategoryDialog open={openEdit} onClose={() => { setOpenEdit(false); setEditData(null); }} onSubmit={handleEdit} initialData={editData} loading={saving} />

      {openDelete && (
        <Paper elevation={6} sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="h6" gutterBottom>Confirmer la suppression</Typography>
            <Typography>Supprimer cette catégorie ? Les produits associés resteront sans catégorie.</Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => { setOpenDelete(false); setDeleteId(null); }} disabled={saving}>Annuler</Button>
              <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
                {saving ? <CircularProgress size={18} color="inherit" /> : 'Supprimer'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
