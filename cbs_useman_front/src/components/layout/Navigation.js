import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Folder as ProjectIcon,
  Storage as StorageIcon,
  Receipt as BillingIcon,
  Assessment as ReportsIcon,
  Business as DepartmentIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const Navigation = () => {
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Departments', icon: <DepartmentIcon />, path: '/departments' },
    { text: 'Projects', icon: <ProjectIcon />, path: '/projects' },
    { text: 'Principal Investigators', icon: <PersonIcon />, path: '/principal-investigators' },
    { text: 'Sponsored Users', icon: <PeopleIcon />, path: '/sponsored-users' },
    { text: 'Storage', icon: <StorageIcon />, path: '/storage' },
    { text: 'Billing Cycles', icon: <BillingIcon />, path: '/billing' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
};

export default Navigation;
