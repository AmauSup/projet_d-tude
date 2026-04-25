
import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
// TODO: Connecter à l'API/backend pour charger et sauvegarder les paramètres

export default function Settings() {
  // TODO: Charger les paramètres réels (général, SEO, sécurité, emails, livraison)
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Paramètres globaux</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Général</Typography>
            {/* TODO: Formulaire paramètres généraux */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (général)</Box>
            <Button variant="contained">Modifier</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">SEO</Typography>
            {/* TODO: Formulaire paramètres SEO */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (SEO)</Box>
            <Button variant="contained">Modifier</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Sécurité</Typography>
            {/* TODO: Formulaire paramètres sécurité */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (sécurité)</Box>
            <Button variant="contained">Modifier</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Emails</Typography>
            {/* TODO: Formulaire paramètres emails */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (emails)</Box>
            <Button variant="contained">Modifier</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Livraison</Typography>
            {/* TODO: Formulaire paramètres livraison */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (livraison)</Box>
            <Button variant="contained">Modifier</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
