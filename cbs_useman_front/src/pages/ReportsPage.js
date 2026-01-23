import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const ReportsPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 200 }}>
            <Typography variant="h6" gutterBottom>
              User Reports
            </Typography>
            <Typography color="text.secondary">
              Generate reports for user accounts, activity, and status.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 200 }}>
            <Typography variant="h6" gutterBottom>
              Billing Reports
            </Typography>
            <Typography color="text.secondary">
              Generate billing reports by project, PI, or billing cycle.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 200 }}>
            <Typography variant="h6" gutterBottom>
              Storage Reports
            </Typography>
            <Typography color="text.secondary">
              View storage allocation and usage reports.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 200 }}>
            <Typography variant="h6" gutterBottom>
              Audit Reports
            </Typography>
            <Typography color="text.secondary">
              View change history and audit trail for user accounts.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
