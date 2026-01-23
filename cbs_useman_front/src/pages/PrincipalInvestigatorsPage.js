import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../components/common/DataTable';
import Notification from '../components/common/Notification';
import PIRequestForm from '../components/forms/PIRequestForm';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const PrincipalInvestigatorsPage = () => {
  const [pis, setPis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPI, setEditingPI] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const columns = [
    { 
      field: 'user.first_name', 
      headerName: 'Name',
      renderCell: (row) => `${row.user?.first_name} ${row.user?.last_name}`
    },
    { field: 'employee_id', headerName: 'Employee ID' },
    { field: 'speedcode', headerName: 'Speedcode' },
    { 
      field: 'department.name', 
      headerName: 'Department',
      renderCell: (row) => row.department?.name || '-'
    },
    { field: 'start_date', headerName: 'Start Date', type: 'date' },
  ];

  useEffect(() => {
    fetchPIs();
  }, []);

  const fetchPIs = async () => {
    try {
      const response = await axios.get(`${API_URL}/accounts/principal-investigators/`);
      setPis(response.data);
    } catch (error) {
      showNotification('Error fetching PIs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pi) => {
    setEditingPI(pi);
    setOpenDialog(true);
  };

  const handleDelete = async (pi) => {
    if (window.confirm(`Are you sure you want to delete PI ${pi.user?.first_name} ${pi.user?.last_name}?`)) {
      try {
        await axios.delete(`${API_URL}/accounts/principal-investigators/${pi.id}/`);
        showNotification('PI deleted successfully', 'success');
        fetchPIs();
      } catch (error) {
        showNotification('Error deleting PI', 'error');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPI(null);
  };

  const handleSuccess = () => {
    showNotification(editingPI ? 'PI updated successfully' : 'PI created successfully', 'success');
    handleCloseDialog();
    fetchPIs();
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Principal Investigators</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add PI
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={pis}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <PIRequestForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        editData={editingPI}
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

export default PrincipalInvestigatorsPage;
