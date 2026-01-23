import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../components/common/DataTable';
import Notification from '../components/common/Notification';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const columns = [
    { field: 'name', headerName: 'Project Name', flex: 1 },
    { 
      field: 'owner', 
      headerName: 'Owner',
      renderCell: (row) => row.owner?.user ? 
        `${row.owner.user.first_name} ${row.owner.user.last_name}` : '-'
    },
    { 
      field: 'is_default', 
      headerName: 'Type',
      renderCell: (row) => row.is_default ? 
        <Chip label="Default" size="small" color="default" /> : 
        <Chip label="Custom" size="small" color="primary" />
    },
    { field: 'created_date', headerName: 'Created', type: 'date' },
    { field: 'description', headerName: 'Description', flex: 1 },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/accounts/projects/`);
      setProjects(response.data);
    } catch (error) {
      showNotification('Error fetching projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => showNotification('Project creation form coming soon', 'info')}
        >
          Add Project
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={projects}
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

export default ProjectsPage;
