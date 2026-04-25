import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

// Props: open, onClose, user
export default function UserDetailDialog({ open, onClose, user }) {
  if (!user) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Détail utilisateur</DialogTitle>
      <DialogContent>
        <Typography><b>Nom :</b> {user.last_name}</Typography>
        <Typography><b>Prénom :</b> {user.first_name}</Typography>
        <Typography><b>Email :</b> {user.email}</Typography>
        <Typography><b>Rôle :</b> {user.role}</Typography>
        <Typography><b>Date création :</b> {user.created_at}</Typography>
        {/* TODO: Afficher adresses, commandes, etc. */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}
