import React, { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Alert,
  CircularProgress, Select, MenuItem, FormControl,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { apiFetch } from '../contexts/AuthContext';
import OrderDetailDialog from '../components/OrderDetailDialog';

// Doit correspondre exactement à ORDER_STATUSES dans server.js
const STATUS_OPTIONS = ['En préparation', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];

const statusColors = {
  'En préparation': 'warning',
  'Confirmée': 'info',
  'Expédiée': 'primary',
  'Livrée': 'success',
  'Annulée': 'error',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDetail, setOpenDetail] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    apiFetch('/pg/admin/orders')
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/pg/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Gestion des commandes</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Aucune commande.</Typography>
                </TableCell>
              </TableRow>
            )}
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>
                  {order.first_name ? `${order.first_name} ${order.last_name}` : order.email || '—'}
                </TableCell>
                <TableCell>
                  <FormControl size="small" disabled={updatingId === order.id}>
                    <Select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      renderValue={(v) => (
                        <Chip label={v} color={statusColors[v] || 'default'} size="small" />
                      )}
                      sx={{ minWidth: 130 }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s}>
                          <Chip label={s} color={statusColors[s] || 'default'} size="small" />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>{Number(order.total_amount).toFixed(2)} €</TableCell>
                <TableCell>{order.created_at ? String(order.created_at).slice(0, 10) : '—'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => { setDetailOrder(order); setOpenDetail(true); }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <OrderDetailDialog
        open={openDetail}
        onClose={() => { setOpenDetail(false); setDetailOrder(null); }}
        order={detailOrder}
      />
    </Box>
  );
}
