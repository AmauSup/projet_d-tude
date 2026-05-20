import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, CircularProgress, Alert,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { apiFetch } from '../contexts/AuthContext';

const PIE_COLORS = ['#1976d2', '#e91e63', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];

function KpiCard({ label, value }) {
  return (
    <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Paper>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/pg/admin/stats')
      .then((data) => setStats(data.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>;

  const kpis = [
    { label: 'Produits actifs', value: stats?.products ?? '—' },
    { label: 'Commandes totales', value: stats?.orders ?? '—' },
    { label: 'Utilisateurs', value: stats?.users ?? '—' },
    { label: 'CA (30 j)', value: stats?.revenue30d != null ? `${Number(stats.revenue30d).toFixed(2)} €` : '—' },
  ];

  const dailyData = (stats?.dailySales || []).map((d) => ({
    day: d.day ? String(d.day).slice(5, 10) : '',
    commandes: Number(d.orders),
    CA: Number(d.revenue),
  }));

  const catData = (stats?.categorySales || []).map((c) => ({
    name: c.category,
    value: Number(c.revenue),
  }));

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Dashboard Administrateur</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((k) => (
          <Grid item xs={12} sm={6} md={3} key={k.label}>
            <KpiCard label={k.label} value={k.value} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Commandes & CA (7 derniers jours)</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData}>
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="commandes" name="Commandes" fill="#1976d2" />
                <Bar yAxisId="right" dataKey="CA" name="CA (€)" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Ventes par catégorie</Typography>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(2)} €`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 2 }}>Aucune donnée</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Dernières commandes</Typography>
        {(stats?.recentOrders || []).length === 0 ? (
          <Typography color="text.secondary">Aucune commande récente.</Typography>
        ) : (
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <Box component="thead">
              <Box component="tr" sx={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
                {['ID', 'Client', 'Statut', 'Total', 'Date'].map((h) => (
                  <Box component="th" key={h} sx={{ p: 1 }}>{h}</Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {(stats.recentOrders || []).map((o) => (
                <Box component="tr" key={o.id} sx={{ borderBottom: '1px solid #f0f0f0', '&:hover': { bgcolor: '#f9f9f9' } }}>
                  <Box component="td" sx={{ p: 1 }}>#{o.id}</Box>
                  <Box component="td" sx={{ p: 1 }}>{o.first_name ? `${o.first_name} ${o.last_name}` : o.email || '—'}</Box>
                  <Box component="td" sx={{ p: 1 }}>{o.status}</Box>
                  <Box component="td" sx={{ p: 1 }}>{Number(o.total_amount).toFixed(2)} €</Box>
                  <Box component="td" sx={{ p: 1 }}>{o.created_at ? String(o.created_at).slice(0, 10) : '—'}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
