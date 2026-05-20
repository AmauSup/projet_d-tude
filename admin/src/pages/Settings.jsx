import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, Alert,
  CircularProgress, Switch, FormControlLabel, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { apiFetch } from '../contexts/AuthContext';

const DEFAULTS = {
  site_name: 'Althea Systems',
  contact_email: '',
  maintenance_mode: 'false',
  seo_title: 'Althea Systems — Solutions informatiques',
  seo_description: '',
  delivery_free_threshold: '0',
  delivery_days_min: '3',
  delivery_days_max: '7',
  email_from_name: 'Althea Systems',
  email_from_address: '',
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch('/pg/admin/settings')
      .then((data) => setSettings({ ...DEFAULTS, ...(data.settings || {}) }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }));
  const setToggle = (key) => (e) => setSettings((s) => ({ ...s, [key]: String(e.target.checked) }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch('/pg/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Paramètres globaux</Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          Enregistrer tout
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Paramètres enregistrés.</Alert>}

      <Grid container spacing={2}>
        {/* Général */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Général</Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField label="Nom du site" value={settings.site_name} onChange={set('site_name')} fullWidth margin="dense" />
            <TextField label="Email de contact" type="email" value={settings.contact_email} onChange={set('contact_email')} fullWidth margin="dense" />
            <FormControlLabel
              control={<Switch checked={settings.maintenance_mode === 'true'} onChange={setToggle('maintenance_mode')} color="warning" />}
              label="Mode maintenance (accès bloqué aux visiteurs)"
              sx={{ mt: 1 }}
            />
          </Paper>
        </Grid>

        {/* SEO */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>SEO</Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField label="Titre meta (balise <title>)" value={settings.seo_title} onChange={set('seo_title')} fullWidth margin="dense" />
            <TextField label="Description meta" value={settings.seo_description} onChange={set('seo_description')} fullWidth margin="dense" multiline rows={3} />
          </Paper>
        </Grid>

        {/* Livraison */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Livraison</Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              label="Livraison gratuite à partir de (€, 0 = jamais gratuite)"
              type="number"
              value={settings.delivery_free_threshold}
              onChange={set('delivery_free_threshold')}
              fullWidth margin="dense"
              inputProps={{ min: 0 }}
            />
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField label="Délai min (jours)" type="number" value={settings.delivery_days_min} onChange={set('delivery_days_min')} fullWidth margin="dense" inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Délai max (jours)" type="number" value={settings.delivery_days_max} onChange={set('delivery_days_max')} fullWidth margin="dense" inputProps={{ min: 1 }} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Emails */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Emails transactionnels</Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField label="Nom expéditeur" value={settings.email_from_name} onChange={set('email_from_name')} fullWidth margin="dense" />
            <TextField label="Adresse expéditeur" type="email" value={settings.email_from_address} onChange={set('email_from_address')} fullWidth margin="dense" />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              L'envoi réel nécessite un service SMTP (ex. Resend, Mailgun) configuré côté backend.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
