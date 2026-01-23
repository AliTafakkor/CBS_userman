import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Paper, Chip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../components/common/DataTable';
import Notification from '../components/common/Notification';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const StoragePage = () => {
  const [allocations, setAllocations] = useState([]);
  const [storageTypes, setStorageTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const columns = [
    { 
      field: 'project', 
      headerName: 'Project',
      renderCell: (row) => row.project?.name || '-'
    },
    { 
      field: 'storage_type', 
      headerName: 'Storage Type',
      renderCell: (row) => {
        const type = row.storage_type;
        if (!type) return '-';
        return type.name === 'legacy_2018' ? 'Legacy (2018)' : 'OneFS (2025)';
      }
    },
    { 
      field: 'allocated_tb', 
      headerName: 'Allocation (TB)',
      renderCell: (row) => `${row.allocated_tb} TB`
    },
    { field: 'start_date', headerName: 'Start Date', type: 'date' },
    { field: 'end_date', headerName: 'End Date', type: 'date' },
    { 
      field: 'status',
      headerName: 'Status',
      renderCell: (row) => {
        const isActive = !row.end_date || new Date(row.end_date) > new Date();
        return isActive ? 
          <Chip label="Active" color="success" size="small" /> :
          <Chip label="Expired" color="default" size="small" />;
      }
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [allocationsRes, typesRes] = await Promise.all([
        axios.get(`${API_URL}/billing/storage-allocations/`),
        axios.get(`${API_URL}/billing/storage-types/`),
      ]);
      setAllocations(allocationsRes.data);
      setStorageTypes(typesRes.data);
    } catch (error) {
      showNotification('Error fetching storage data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Storage Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {storageTypes.map((type) => (
          <Grid item xs={12} sm={6} key={type.id}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6">
                {type.name === 'legacy_2018' ? 'Legacy (2018)' : 'OneFS (2025)'}
              </Typography>
              <Typography variant="h4" color="primary" sx={{ my: 1 }}>
                ${type.rate_per_tb_per_year}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                per TB per Year
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Storage Allocations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => showNotification('Storage allocation form coming soon', 'info')}
        >
          Add Allocation
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={allocations}
        loading={loading}
      />

      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </Box>
  );
};

export default StoragePage;
