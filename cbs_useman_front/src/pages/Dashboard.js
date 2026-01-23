import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  Folder as ProjectIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import StatsCard from '../components/common/StatsCard';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPIs: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pisRes, usersRes, projectsRes] = await Promise.all([
          axios.get(`${API_URL}/accounts/principal-investigators/`),
          axios.get(`${API_URL}/accounts/sponsored-users/`),
          axios.get(`${API_URL}/accounts/projects/`),
        ]);

        const users = usersRes.data;
        setStats({
          totalPIs: pisRes.data.length,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          totalProjects: projectsRes.data.length,
          pendingApprovals: users.filter(u => u.status === 'pending').length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Principal Investigators"
            value={stats.totalPIs}
            icon={<PersonIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon />}
            color="info.main"
            subtitle={`${stats.activeUsers} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Projects"
            value={stats.totalProjects}
            icon={<ProjectIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<PeopleIcon />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography color="text.secondary">
              No recent activity to display
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Typography color="text.secondary">
              All systems operational
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
