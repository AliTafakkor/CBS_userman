import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../components/common/DataTable';
import Notification from '../components/common/Notification';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const columns = [
    { field: 'name', headerName: 'Department Name', flex: 1 },
    { field: 'code', headerName: 'Code', width: 150 },
    { field: 'description', headerName: 'Description', flex: 1 },
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/accounts/departments/`);
      setDepartments(response.data);
    } catch (error) {
      showNotification('Error fetching departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`${API_URL}/accounts/departments/${editingId}/`, formData);
        showNotification('Department updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/accounts/departments/`, formData);
        showNotification('Department created successfully', 'success');
      }
      handleCloseDialog();
      fetchDepartments();
    } catch (error) {
      showNotification('Error saving department', 'error');
    }
  };

  const handleEdit = (department) => {
    setFormData({ name: department.name, code: department.code, description: department.description });
    setEditingId(department.id);
    setOpenDialog(true);
  };

  const handleDelete = async (department) => {
    if (window.confirm(`Are you sure you want to delete ${department.name}?`)) {
      try {
        await axios.delete(`${API_URL}/accounts/departments/${department.id}/`);
        showNotification('Department deleted successfully', 'success');
        fetchDepartments();
      } catch (error) {
        showNotification('Error deleting department', 'error');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', code: '', description: '' });
    setEditingId(null);
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Departments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Department
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={departments}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Department Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </Box>
  );
};

export default DepartmentsPage;
