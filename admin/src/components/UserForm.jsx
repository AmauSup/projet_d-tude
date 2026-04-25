import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem } from '@mui/material';

// Props: open, onClose, onSubmit, initialData
const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'Utilisateur' },
];

export default function UserForm({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState({
    last_name: '',
    first_name: '',
    email: '',
    role: 'user',
  });

  useEffect(() => {
    setForm({
      last_name: initialData?.last_name || '',
      first_name: initialData?.first_name || '',
      email: initialData?.email || '',
      role: initialData?.role || 'user',
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initialData ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Nom"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <TextField
            label="Prénom"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Rôle"
            name="role"
            value={form.role}
            onChange={handleChange}
            fullWidth
            required
          >
            {roles.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained">{initialData ? 'Enregistrer' : 'Ajouter'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
