
import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton, Chip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import OrderDetailDialog from '../components/OrderDetailDialog';

// Données factices pour la maquette
const fakeOrders = [
  {
    id: 101,
    user: 'Jean Dupont',
    status: 'pending',
    total_amount: 199.99,
    created_at: '2026-04-25',
    payment_method: 'CB',
  },
  {
    id: 102,
    user: 'Alice Martin',
    status: 'completed',
    total_amount: 59.99,
    created_at: '2026-04-24',
    payment_method: 'Paypal',
  },
];

const statusColors = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'error',
  shipped: 'info',
};

export default function Orders() {
  const [orders, setOrders] = useState(fakeOrders);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Suppression commande (mock)
  const handleDeleteOrder = () => {
    setOrders((prev) => prev.filter(o => o.id !== deleteId));
    setOpenDelete(false);
    setDeleteId(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Gestion des commandes</Typography>

      {/* TODO: Filtres de recherche (statut, client, date, etc.) */}
      <Box sx={{ mb: 2, color: '#888' }}>À compléter (filtres de recherche)</Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Méthode paiement</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.user}</TableCell>
                <TableCell>
                  <Chip label={order.status} color={statusColors[order.status] || 'default'} size="small" />
                </TableCell>
                <TableCell>{order.payment_method}</TableCell>
                <TableCell>{order.total_amount} €</TableCell>
                <TableCell>{order.created_at}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                    onClick={() => {
                      setDetailOrder(order);
                      setOpenDetail(true);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleteId(order.id);
                      setOpenDelete(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modale détail commande */}
      <OrderDetailDialog
        open={openDetail}
        onClose={() => { setOpenDetail(false); setDetailOrder(null); }}
        order={detailOrder}
      />

      {/* Modale suppression commande */}
      {openDelete && (
        <Paper elevation={6} sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="h6" gutterBottom>Confirmer la suppression</Typography>
            <Typography>Voulez-vous vraiment supprimer cette commande ?</Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => { setOpenDelete(false); setDeleteId(null); }}>Annuler</Button>
              <Button variant="contained" color="error" onClick={handleDeleteOrder}>Supprimer</Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* TODO: Modal de détail commande, actions avancées */}
      <Box sx={{ mt: 2, color: '#888' }}>À compléter (modal détail commande, actions avancées)</Box>
    </Box>
  );
}
