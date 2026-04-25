
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
// TODO: Connecter à l'API/backend pour authentification sécurisée (table users)

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  // TODO: Ajouter gestion 2FA, anti-brute-force, validation, erreurs

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 340 }}>
        <Typography variant="h5" align="center" gutterBottom>Connexion administrateur</Typography>
        <form>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            autoComplete="username"
            required
          />
          <TextField
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            autoComplete="current-password"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {/* TODO: 2FA (code OTP) */}
          <Box sx={{ color: '#888', my: 1 }}>À compléter (2FA, OTP, sécurité)</Box>
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Se connecter</Button>
        </form>
      </Paper>
    </Box>
  );
}
