
import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
// TODO: Connecter à l'API/backend pour charger les tickets/messages

// Données factices pour la maquette
const fakeTickets = [
  { id: 1, subject: 'Problème de paiement', status: 'ouvert', user: 'Jean Dupont', created_at: '2026-04-20' },
  { id: 2, subject: 'Erreur produit', status: 'fermé', user: 'Alice Martin', created_at: '2026-04-22' },
];

const statusColors = {
  ouvert: 'warning',
  fermé: 'success',
  en_cours: 'info',
};

export default function Support() {
  const [tickets] = useState(fakeTickets);
  // TODO: Ajouter gestion modals, filtres, chatbot, actions

  return (
    <Box sx={{ p: 2 }}>
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="h4">Centre de support</Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" startIcon={<AddIcon />}>Nouveau ticket</Button>
        </Grid>
      </Grid>

      {/* TODO: Filtres de recherche (statut, utilisateur, date, etc.) */}
      <Box sx={{ mb: 2, color: '#888' }}>À compléter (filtres de recherche)</Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Sujet</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.id}</TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>{ticket.user}</TableCell>
                <TableCell>
                  <Chip label={ticket.status} color={statusColors[ticket.status] || 'default'} size="small" />
                </TableCell>
                <TableCell>{ticket.created_at}</TableCell>
                <TableCell align="right">
                  {/* TODO: Bouton voir détail, actions */}
                  <IconButton size="small" color="primary">
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* TODO: Modals pour création/réponse, chatbot, etc. */}
      <Box sx={{ mt: 2, color: '#888' }}>À compléter (modals, chatbot, réponses)</Box>
    </Box>
  );
}
