import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

// Props: open, onClose, onSubmit, initialData
export default function CategoryForm({ open, onClose, onSubmit, initialData }) {
  const [name, setName] = useState(initialData?.name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
  };

  // Reset form when initialData changes
  React.useEffect(() => {
    setName(initialData?.name || '');
  }, [initialData]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initialData ? 'Modifier une catégorie' : 'Ajouter une catégorie'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Nom de la catégorie"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained">{initialData ? 'Enregistrer' : 'Ajouter'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
