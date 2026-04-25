
import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import UserForm from '../components/UserForm';
import UserDetailDialog from '../components/UserDetailDialog';

// Données factices pour la maquette
const fakeUsers = [
  { id: 1, last_name: 'Dupont', first_name: 'Jean', email: 'jean.dupont@email.com', created_at: '2026-04-20', role: 'admin' },
  { id: 2, last_name: 'Martin', first_name: 'Alice', email: 'alice.martin@email.com', created_at: '2026-04-22', role: 'user' },
];

export default function Users() {
  const [users, setUsers] = useState(fakeUsers);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  // Ajout utilisateur (mock)
  const handleAddUser = (data) => {
    setUsers((prev) => [
      ...prev,
      { id: prev.length + 1, ...data, created_at: new Date().toISOString().slice(0, 10) },
    ]);
    setOpenAdd(false);
  };

  // Edition utilisateur (mock)
  const handleEditUser = (data) => {
    setUsers((prev) => prev.map(u =>
      u.id === editData.id ? { ...u, ...data } : u
    ));
    setOpenEdit(false);
    setEditData(null);
  };

  // Suppression utilisateur (mock)
  const handleDeleteUser = () => {
    setUsers((prev) => prev.filter(u => u.id !== deleteId));
    setOpenDelete(false);
    setDeleteId(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="h4">Gestion des utilisateurs</Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
            Ajouter un utilisateur
          </Button>
        </Grid>
      </Grid>

      {/* TODO: Filtres de recherche (nom, email, rôle, etc.) */}
      <Box sx={{ mb: 2, color: '#888' }}>À compléter (filtres de recherche)</Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Prénom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Date création</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.last_name}</TableCell>
                <TableCell>{user.first_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.created_at}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                    onClick={() => {
                      setDetailUser(user);
                      setOpenDetail(true);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                    onClick={() => {
                      setEditData(user);
                      setOpenEdit(true);
                    }}
                  >
                    <span role="img" aria-label="edit">✏️</span>
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleteId(user.id);
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

      {/* Modal ajout utilisateur */}
      <UserForm
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleAddUser}
      />

      {/* Modal édition utilisateur */}
      <UserForm
        open={openEdit}
        onClose={() => { setOpenEdit(false); setEditData(null); }}
        onSubmit={handleEditUser}
        initialData={editData}
      />

      {/* Modal suppression utilisateur */}
      {openDelete && (
        <Paper elevation={6} sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="h6" gutterBottom>Confirmer la suppression</Typography>
            <Typography>Voulez-vous vraiment supprimer cet utilisateur ?</Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => { setOpenDelete(false); setDeleteId(null); }}>Annuler</Button>
              <Button variant="contained" color="error" onClick={handleDeleteUser}>Supprimer</Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Modal détail utilisateur */}
      <UserDetailDialog
        open={openDetail}
        onClose={() => { setOpenDetail(false); setDetailUser(null); }}
        user={detailUser}
      />
    </Box>
  );
}
