import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Alert,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiFetch } from '../contexts/AuthContext';

const statusColors = {
  open: 'warning',
  closed: 'success',
  in_progress: 'info',
};

const statusLabel = { open: 'Ouvert', closed: 'Fermé', in_progress: 'En cours' };

export default function Support() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/pg/admin/messages')
      .then((data) => setMessages(data.messages || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleClose = async (id) => {
    setSaving(true);
    try {
      await apiFetch(`/pg/admin/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'closed', admin_reply: reply }),
      });
      setSelected(null);
      setReply('');
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
      <Typography variant="h4" sx={{ mb: 2 }}>Centre de support</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Sujet</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">Aucun message.</Typography>
                </TableCell>
              </TableRow>
            )}
            {messages.map((msg) => (
              <TableRow key={msg.id}>
                <TableCell>{msg.id}</TableCell>
                <TableCell>{msg.subject || '—'}</TableCell>
                <TableCell>
                  {msg.first_name ? `${msg.first_name} ${msg.last_name}` : '—'}
                </TableCell>
                <TableCell>{msg.email || '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabel[msg.status] || msg.status}
                    color={statusColors[msg.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{msg.created_at ? String(msg.created_at).slice(0, 10) : '—'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => { setSelected(msg); setReply(msg.admin_reply || ''); }}>
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!selected} onClose={() => { setSelected(null); setReply(''); }} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>Message #{selected.id} — {selected.subject || 'Sans sujet'}</DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                De : {selected.first_name ? `${selected.first_name} ${selected.last_name}` : '—'} ({selected.email})
              </Typography>
              <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{selected.message}</Typography>
              <TextField
                label="Réponse admin (optionnelle)"
                multiline
                rows={4}
                fullWidth
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={saving || selected.status === 'closed'}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setSelected(null); setReply(''); }}>Fermer</Button>
              {selected.status !== 'closed' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                  onClick={() => handleClose(selected.id)}
                  disabled={saving}
                >
                  Clôturer
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
