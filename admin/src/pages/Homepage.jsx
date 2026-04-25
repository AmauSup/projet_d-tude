
import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// TODO: Connecter à l'API/backend pour charger les contenus homepage

export default function Homepage() {
  // TODO: Charger les données réelles (carrousel, texte, catégories, top produits)
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Gestion de la page d'accueil</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Carrousel</Typography>
            {/* TODO: Gestion des images du carrousel */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (carrousel images)</Box>
            <Button variant="contained" startIcon={<AddIcon />}>Ajouter une image</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Texte d'accueil</Typography>
            {/* TODO: Gestion du texte d'accueil */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (texte d'accueil)</Box>
            <Button variant="contained">Modifier le texte</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Catégories mises en avant</Typography>
            {/* TODO: Sélection des catégories */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (catégories en avant)</Box>
            <Button variant="contained">Gérer les catégories</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Top produits</Typography>
            {/* TODO: Sélection des top produits */}
            <Box sx={{ color: '#888', mb: 1 }}>À compléter (top produits)</Box>
            <Button variant="contained">Gérer les produits</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
