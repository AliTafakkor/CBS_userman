import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { Add as AddIcon, PlayArrow as ProcessIcon } from '@mui/icons-material';
import DataTable from '../components/common/DataTable';
import Notification from '../components/common/Notification';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const BillingPage = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const columns = [
    { field: 'name', headerName: 'Cycle Name', flex: 1 },
    { field: 'start_date', headerName: 'Start Date', type: 'date' },
    { field: 'end_date', headerName: 'End Date', type: 'date' },
    { 
      field: 'is_processed', 
      headerName: 'Status',
      renderCell: (row) => row.is_processed ? 
        <Chip label="Processed" color="success" size="small" /> :
        <Chip label="Pending" color="warning" size="small" />
    },
    { field: 'processed_date', headerName: 'Processed On', type: 'date' },
  ];

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      const response = await axios.get(`${API_URL}/billing/cycles/`);
      setCycles(response.data);
    } catch (error) {
      showNotification('Error fetching billing cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessCycle = async (cycle) => {
    if (window.confirm(`Process billing for ${cycle.name}?`)) {
      try {
        await axios.post(`${API_URL}/billing/cycles/${cycle.id}/generate_billing/`);
        showNotification('Billing processed successfully', 'success');
        fetchCycles();
      } catch (error) {
        showNotification('Error processing billing', 'error');
      }
    }
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Billing Cycles</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => showNotification('Create cycle form coming soon', 'info')}
        >
          Add Cycle
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={cycles}
        loading={loading}
        onView={(cycle) => showNotification('View billing records coming soon', 'info')}
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

export default BillingPage;
