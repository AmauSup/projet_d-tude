import React, { useState } from 'react';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Grid, MenuItem, Slider, TextField, Tooltip, Typography,
} from '@mui/material';

// Props: open, onClose, onSubmit, initialData, categories, languages
export default function ProductForm({ open, onClose, onSubmit, initialData, categories, languages }) {
  const [form, setForm] = useState(
    initialData || {
      price: '',
      stock: 0,
      category_id: '',
      image: '',
      slug: '',
      priority: 0,
      featured: 0,
      translations: languages?.map(l => ({ language_id: l.id, name: '', description: '', characteristics: '' })) || [],
    }
  );

  // Gestion des champs principaux
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Gestion des traductions
  const handleTranslationChange = (idx, field, value) => {
    setForm((prev) => {
      const translations = [...prev.translations];
      translations[idx][field] = value;
      return { ...prev, translations };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Modifier un produit' : 'Ajouter un produit'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prix (€)"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Stock"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Catégorie"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                fullWidth
                required
              >
                {categories?.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Image (URL)"
                name="image"
                value={form.image}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Slug (URL slug, ex: tensiometre-pro)"
                name="slug"
                value={form.slug || ''}
                onChange={handleChange}
                fullWidth
                helperText="Laissez vide pour auto-génération"
              />
            </Grid>

            {/* Priorité dans la catégorie */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Priorité dans la catégorie : {form.priority}
              </Typography>
              <Tooltip title="0 = normal · valeur haute = affiché en premier dans la catégorie">
                <Slider
                  value={Number(form.priority) || 0}
                  onChange={(_, v) => setForm(p => ({ ...p, priority: v }))}
                  min={0} max={10} step={1}
                  marks valueLabelDisplay="auto"
                />
              </Tooltip>
            </Grid>

            {/* Produit mis en avant (Top du moment) */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Rang "Top Produits" : {form.featured}
              </Typography>
              <Tooltip title="0 = non mis en avant · valeur haute = en tête de la section Top Produits">
                <Slider
                  value={Number(form.featured) || 0}
                  onChange={(_, v) => setForm(p => ({ ...p, featured: v }))}
                  min={0} max={10} step={1}
                  marks valueLabelDisplay="auto"
                />
              </Tooltip>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Number(form.featured) > 0}
                    onChange={(e) => setForm(p => ({ ...p, featured: e.target.checked ? 1 : 0 }))}
                  />
                }
                label="Mis en avant sur la page d'accueil"
              />
            </Grid>
          </Grid>

          <Box mt={3}>
            <Typography variant="subtitle1">Traductions</Typography>
            {languages?.map((lang, idx) => (
              <Box key={lang.id} sx={{ border: '1px solid #eee', borderRadius: 1, p: 2, mt: 1 }}>
                <Typography variant="body2" color="textSecondary">{lang.name}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nom"
                      value={form.translations[idx]?.name || ''}
                      onChange={e => handleTranslationChange(idx, 'name', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Caractéristiques"
                      value={form.translations[idx]?.characteristics || ''}
                      onChange={e => handleTranslationChange(idx, 'characteristics', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      value={form.translations[idx]?.description || ''}
                      onChange={e => handleTranslationChange(idx, 'description', e.target.value)}
                      fullWidth
                      multiline
                      minRows={2}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" color="primary">
            {initialData ? 'Enregistrer les modifications' : 'Créer le produit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
