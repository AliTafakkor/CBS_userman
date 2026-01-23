import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../components/common/DataTable';
import Notification from '../components/common/Notification';
import UserRequestForm from '../components/forms/UserRequestForm';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const SponsoredUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const columns = [
    { 
      field: 'user.first_name', 
      headerName: 'Name',
      renderCell: (row) => `${row.user?.first_name} ${row.user?.last_name}`
    },
    { field: 'user.email', headerName: 'Email', renderCell: (row) => row.user?.email },
    { field: 'user_type', headerName: 'Type' },
    { field: 'user_role', headerName: 'Role' },
    { field: 'status', headerName: 'Status', type: 'status' },
    { 
      field: 'sponsor', 
      headerName: 'Sponsor',
      renderCell: (row) => row.sponsor?.user ? 
        `${row.sponsor.user.first_name} ${row.sponsor.user.last_name}` : '-'
    },
    { 
      field: 'project', 
      headerName: 'Project',
      renderCell: (row) => row.project?.name || '-'
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/accounts/sponsored-users/`);
      setUsers(response.data);
    } catch (error) {
      showNotification('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setOpenDialog(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.user?.first_name} ${user.user?.last_name}?`)) {
      try {
        await axios.delete(`${API_URL}/accounts/sponsored-users/${user.id}/`);
        showNotification('User deleted successfully', 'success');
        fetchUsers();
      } catch (error) {
        showNotification('Error deleting user', 'error');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    showNotification(editingUser ? 'User updated successfully' : 'User created successfully', 'success');
    handleCloseDialog();
    fetchUsers();
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sponsored Users</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add User
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <UserRequestForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        editData={editingUser}
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

export default SponsoredUsersPage;
