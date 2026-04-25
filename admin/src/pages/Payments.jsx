
import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton, Button, Chip } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
// TODO: Connecter à l'API/backend pour charger les transactions et méthodes de paiement

// Données factices pour la maquette
const fakePayments = [
  { id: 1, order_id: 101, user: 'Jean Dupont', method: 'CB', amount: 199.99, status: 'payé', date: '2026-04-25' },
  { id: 2, order_id: 102, user: 'Alice Martin', method: 'Paypal', amount: 59.99, status: 'remboursé', date: '2026-04-24' },
];

const statusColors = {
  payé: 'success',
  remboursé: 'info',
  échec: 'error',
};

export default function Payments() {
  const [payments] = useState(fakePayments);
  // TODO: Ajouter gestion logs, remboursements, filtres, sécurité

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Gestion des paiements</Typography>

      {/* TODO: Filtres de recherche (statut, méthode, date, etc.) */}
      <Box sx={{ mb: 2, color: '#888' }}>À compléter (filtres de recherche)</Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Commande</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Méthode</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((pay) => (
              <TableRow key={pay.id}>
                <TableCell>{pay.id}</TableCell>
                <TableCell>{pay.order_id}</TableCell>
                <TableCell>{pay.user}</TableCell>
                <TableCell>{pay.method}</TableCell>
                <TableCell>{pay.amount} €</TableCell>
                <TableCell>
                  <Chip label={pay.status} color={statusColors[pay.status] || 'default'} size="small" />
                </TableCell>
                <TableCell>{pay.date}</TableCell>
                <TableCell align="right">
                  {/* TODO: Bouton remboursement, logs */}
                  <IconButton size="small" color="primary" sx={{ mr: 1 }}>
                    <ReplayIcon />
                  </IconButton>
                  <Button size="small" variant="outlined">Logs</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* TODO: Modals pour logs, remboursement, sécurité */}
      <Box sx={{ mt: 2, color: '#888' }}>À compléter (modals logs, remboursement, sécurité)</Box>
    </Box>
  );
}
