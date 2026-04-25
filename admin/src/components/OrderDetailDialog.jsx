import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

// Props: open, onClose, order
export default function OrderDetailDialog({ open, onClose, order }) {
  if (!order) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Détail de la commande #{order.id}</DialogTitle>
      <DialogContent>
        <Typography><b>Client :</b> {order.user}</Typography>
        <Typography><b>Statut :</b> {order.status}</Typography>
        <Typography><b>Méthode de paiement :</b> {order.payment_method}</Typography>
        <Typography><b>Total :</b> {order.total_amount} €</Typography>
        <Typography><b>Date :</b> {order.created_at}</Typography>
        {/* TODO: Afficher les items de la commande, adresses, logs, etc. */}
        <Box sx={{ mt: 2, color: '#888' }}>À compléter (items, adresses, logs...)</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}
