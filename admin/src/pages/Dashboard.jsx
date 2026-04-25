
import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// TODO: Connecter aux données réelles (API/backend)
const fakeKPIs = [
  { label: 'Produits', value: 120 },
  { label: 'Commandes', value: 87 },
  { label: 'Utilisateurs', value: 45 },
  { label: 'CA (30j)', value: '12 500 €' },
];

export default function Dashboard() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Dashboard Administrateur</Typography>
      <Grid container spacing={2}>
        {fakeKPIs.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">{kpi.label}</Typography>
              <Typography variant="h5" color="primary">{kpi.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Commandes récentes</Typography>
            {/* TODO: Tableau des commandes récentes */}
            <Box sx={{ color: '#888' }}>À compléter (tableau commandes récentes)</Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Top produits</Typography>
            {/* TODO: Liste des top produits */}
            <Box sx={{ color: '#888' }}>À compléter (liste top produits)</Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Activité récente</Typography>
            {/* TODO: Timeline ou log d'activité */}
            <Box sx={{ color: '#888' }}>À compléter (timeline activité)</Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
