import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, ButtonGroup, CircularProgress, Grid, Paper, Typography,
} from '@mui/material';
import {
  Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { apiFetch } from '../contexts/AuthContext';

const PIE_COLORS = ['#1976d2', '#e91e63', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];

const PERIODS = [
  { value: '7d',  label: '7 jours' },
  { value: '5w',  label: '5 semaines' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
];

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
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback((p) => {
    setLoading(true);
    setError('');
    apiFetch(`/pg/admin/stats?period=${p}`)
      .then((data) => setStats(data.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(period); }, [period, loadStats]);

  const handlePeriod = (p) => {
    setPeriod(p);
  };

  const kpis = [
    { label: 'Produits actifs', value: stats?.products ?? '—' },
    { label: 'Commandes totales', value: stats?.orders ?? '—' },
    { label: 'Utilisateurs', value: stats?.users ?? '—' },
    { label: 'CA (30 j)', value: stats?.revenue30d != null ? `${Number(stats.revenue30d).toFixed(2)} €` : '—' },
  ];

  // Histogramme 1 : commandes & CA sur la période
  const salesData = (stats?.dailySales || []).map((d) => ({
    label: d.label || String(d.day || '').slice(5, 10),
    Commandes: Number(d.orders),
    'CA (€)': Number(d.revenue),
  }));

  // Histogramme 2 : panier moyen par catégorie (multi-couches)
  const basketData = (stats?.avgBasketByCategory || []).map((c) => ({
    category: c.category,
    'Prix moyen (€)': Number(c.avg_unit_price),
    'CA total (€)': Number(c.total_revenue),
    Commandes: Number(c.order_count),
  }));

  // Camembert : répartition des ventes par catégorie
  const catData = (stats?.categorySales || []).map((c) => ({
    name: c.category,
    value: Number(c.revenue),
  }));

  const periodLabel = PERIODS.find((p) => p.value === period)?.label || '';

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Dashboard Administrateur</Typography>
        <ButtonGroup size="small" variant="outlined">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              onClick={() => handlePeriod(p.value)}
              variant={period === p.value ? 'contained' : 'outlined'}
            >
              {p.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((k) => (
          <Grid item xs={12} sm={6} md={3} key={k.label}>
            <KpiCard label={k.label} value={loading ? '…' : k.value} />
          </Grid>
        ))}
      </Grid>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Ligne 1 : Commandes/CA + Camembert */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Commandes &amp; CA ({periodLabel})
                </Typography>
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={salesData}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Commandes" fill="#1976d2" />
                      <Bar yAxisId="right" dataKey="CA (€)" fill="#4caf50" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 2 }}>Aucune vente sur cette période.</Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Répartition des ventes</Typography>
                {catData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {catData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${Number(v).toFixed(2)} €`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 2 }}>Aucune donnée</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Ligne 2 : Paniers moyens par catégorie (multi-couches) */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Paniers moyens par catégorie ({periodLabel})
            </Typography>
            {basketData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={basketData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Prix moyen (€)" fill="#1976d2" />
                  <Bar dataKey="CA total (€)" fill="#4caf50" />
                  <Bar dataKey="Commandes" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 2 }}>Aucune donnée sur cette période.</Typography>
            )}
          </Paper>

          {/* Dernières commandes */}
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
                      <Box component="td" sx={{ p: 1 }}>{o.first_name ? `${o.first_name} ${o.last_name}` : (o.email || '—')}</Box>
                      <Box component="td" sx={{ p: 1 }}>{o.status}</Box>
                      <Box component="td" sx={{ p: 1 }}>{Number(o.total_amount).toFixed(2)} €</Box>
                      <Box component="td" sx={{ p: 1 }}>{o.created_at ? String(o.created_at).slice(0, 10) : '—'}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
