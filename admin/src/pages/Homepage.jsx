import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, Alert,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { apiFetch } from '../contexts/AuthContext';

function SlideDialog({ open, onClose, onSubmit, initialData, loading }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || '');
      setSubtitle(initialData?.subtitle || '');
      setImageUrl(initialData?.image_url || '');
      setLinkUrl(initialData?.link_url || '');
      setOrderIndex(initialData?.order_index ?? 0);
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, subtitle, image_url: imageUrl, link_url: linkUrl, order_index: Number(orderIndex) });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initialData ? 'Modifier le slide' : 'Ajouter un slide'}</DialogTitle>
        <DialogContent dividers>
          <TextField label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth margin="dense" />
          <TextField label="Sous-titre" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} fullWidth margin="dense" />
          <TextField label="URL image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} fullWidth margin="dense" />
          <TextField label="URL lien (optionnel)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} fullWidth margin="dense" />
          <TextField label="Ordre" type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function Homepage() {
  const [fixedMessage, setFixedMessage] = useState('');
  const [carousel, setCarousel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [msgSaved, setMsgSaved] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editSlide, setEditSlide] = useState(null);
  const [savingSlide, setSavingSlide] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/pg/admin/homepage')
      .then((data) => {
        setFixedMessage(data.homepage?.fixed_message || '');
        setCarousel(data.homepage?.carousel || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSaveMessage = async () => {
    setSaving(true);
    setMsgSaved(false);
    try {
      await apiFetch('/pg/admin/homepage', { method: 'PUT', body: JSON.stringify({ fixed_message: fixedMessage }) });
      setMsgSaved(true);
      setTimeout(() => setMsgSaved(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleAddSlide = async (data) => {
    setSavingSlide(true);
    try {
      await apiFetch('/pg/admin/carousel', { method: 'POST', body: JSON.stringify(data) });
      setOpenAdd(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setSavingSlide(false); }
  };

  const handleEditSlide = async (data) => {
    setSavingSlide(true);
    try {
      await apiFetch(`/pg/admin/carousel/${editSlide.id}`, { method: 'PUT', body: JSON.stringify(data) });
      setOpenEdit(false);
      setEditSlide(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setSavingSlide(false); }
  };

  const handleDeleteSlide = async (id) => {
    if (!window.confirm('Supprimer ce slide ?')) return;
    try {
      await apiFetch(`/pg/admin/carousel/${id}`, { method: 'DELETE' });
      load();
    } catch (err) { setError(err.message); }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Gestion de la page d'accueil</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {msgSaved && <Alert severity="success" sx={{ mb: 2 }}>Message enregistré.</Alert>}

      <Grid container spacing={2}>
        {/* Texte d'accueil */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Message d'accueil</Typography>
            <TextField
              label="Texte affiché en page d'accueil"
              value={fixedMessage}
              onChange={(e) => setFixedMessage(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 1 }}
            />
            <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveMessage} disabled={saving}>
              Enregistrer le message
            </Button>
          </Paper>
        </Grid>

        {/* Carrousel */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Carrousel</Typography>
              <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setOpenAdd(true)}>
                Ajouter un slide
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ordre</TableCell>
                    <TableCell>Titre</TableCell>
                    <TableCell>Sous-titre</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carousel.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary" variant="body2">Aucun slide.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {carousel.map((slide) => (
                    <TableRow key={slide.id}>
                      <TableCell>{slide.order_index}</TableCell>
                      <TableCell>{slide.title || '—'}</TableCell>
                      <TableCell>{slide.subtitle || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {slide.image_url || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" sx={{ mr: 0.5 }}
                          onClick={() => { setEditSlide(slide); setOpenEdit(true); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteSlide(slide.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <SlideDialog open={openAdd} onClose={() => setOpenAdd(false)} onSubmit={handleAddSlide} loading={savingSlide} />
      <SlideDialog open={openEdit} onClose={() => { setOpenEdit(false); setEditSlide(null); }} onSubmit={handleEditSlide} initialData={editSlide} loading={savingSlide} />
    </Box>
  );
}
