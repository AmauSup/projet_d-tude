import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Alert,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { apiFetch } from '../contexts/AuthContext';

const STATUS_COLORS = {
  completed: 'success',
  confirmed: 'info',
  pending: 'warning',
  cancelled: 'error',
  shipped: 'primary',
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiFetch('/pg/admin/payments')
      .then((data) => {
        setPayments(data.payments || []);
        setFiltered(data.payments || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(payments); return; }
    const q = search.toLowerCase();
    setFiltered(payments.filter((p) =>
      String(p.order_id).includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.first_name || '').toLowerCase().includes(q) ||
      (p.last_name || '').toLowerCase().includes(q) ||
      (p.payment_summary || '').toLowerCase().includes(q),
    ));
  }, [search, payments]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Gestion des paiements</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TextField
        placeholder="Rechercher par commande, client, méthode…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, minWidth: 320 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Commande</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Méthode</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Statut commande</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Aucun paiement.</Typography>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((pay) => (
              <TableRow
                key={pay.order_id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelected(pay)}
              >
                <TableCell>#{pay.order_id}</TableCell>
                <TableCell>
                  {pay.first_name ? `${pay.first_name} ${pay.last_name}` : pay.email || '—'}
                </TableCell>
                <TableCell>{pay.payment_summary || '—'}</TableCell>
                <TableCell>{Number(pay.amount).toFixed(2)} €</TableCell>
                <TableCell>
                  <Chip
                    label={pay.order_status}
                    color={STATUS_COLORS[pay.order_status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{pay.created_at ? String(pay.created_at).slice(0, 10) : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="xs" fullWidth>
        {selected && (
          <>
            <DialogTitle>Détail — Commande #{selected.order_id}</DialogTitle>
            <DialogContent dividers>
              <Typography><strong>Client :</strong> {selected.first_name ? `${selected.first_name} ${selected.last_name}` : '—'}</Typography>
              <Typography><strong>Email :</strong> {selected.email || '—'}</Typography>
              <Typography><strong>Méthode :</strong> {selected.payment_summary || '—'}</Typography>
              <Typography><strong>Montant :</strong> {Number(selected.amount).toFixed(2)} €</Typography>
              <Typography><strong>Statut commande :</strong> {selected.order_status}</Typography>
              <Typography><strong>Date :</strong> {selected.created_at ? String(selected.created_at).slice(0, 16).replace('T', ' ') : '—'}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
