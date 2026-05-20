import React, { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, IconButton, Alert,
  CircularProgress, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '../contexts/AuthContext';
import UserForm from '../components/UserForm';
import UserDetailDialog from '../components/UserDetailDialog';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/pg/admin/users')
      .then((data) => setUsers(data.users || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAddUser = async (data) => {
    setSaving(true);
    try {
      await apiFetch('/pg/admin/users', { method: 'POST', body: JSON.stringify(data) });
      setOpenAdd(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async (data) => {
    setSaving(true);
    try {
      await apiFetch(`/pg/admin/users/${editData.id}`, { method: 'PUT', body: JSON.stringify(data) });
      setOpenEdit(false);
      setEditData(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    setSaving(true);
    try {
      await apiFetch(`/pg/admin/users/${deleteId}/delete`, { method: 'PATCH' });
      setOpenDelete(false);
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

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

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

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
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">Aucun utilisateur.</Typography>
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.last_name || '—'}</TableCell>
                <TableCell>{user.first_name || '—'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.is_admin ? 'admin' : 'user'}
                    color={user.is_admin ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.created_at ? String(user.created_at).slice(0, 10) : '—'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" sx={{ mr: 0.5 }} onClick={() => { setDetailUser(user); setOpenDetail(true); }}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" color="primary" sx={{ mr: 0.5 }} onClick={() => { setEditData(user); setOpenEdit(true); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => { setDeleteId(user.id); setOpenDelete(true); }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <UserForm open={openAdd} onClose={() => setOpenAdd(false)} onSubmit={handleAddUser} loading={saving} />

      <UserForm
        open={openEdit}
        onClose={() => { setOpenEdit(false); setEditData(null); }}
        onSubmit={handleEditUser}
        initialData={editData}
        loading={saving}
      />

      {openDelete && (
        <Paper elevation={6} sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="h6" gutterBottom>Confirmer la suppression</Typography>
            <Typography>Voulez-vous vraiment supprimer cet utilisateur ? (soft-delete)</Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => { setOpenDelete(false); setDeleteId(null); }} disabled={saving}>Annuler</Button>
              <Button variant="contained" color="error" onClick={handleDeleteUser} disabled={saving}>
                {saving ? <CircularProgress size={18} color="inherit" /> : 'Supprimer'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <UserDetailDialog
        open={openDetail}
        onClose={() => { setOpenDetail(false); setDetailUser(null); }}
        user={detailUser}
      />
    </Box>
  );
}
