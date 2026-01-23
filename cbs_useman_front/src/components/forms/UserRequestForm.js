// src/components/forms/UserRequestForm.js
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { 
  Button, 
  TextField, 
  FormControl, 
  FormHelperText, 
  Grid, 
  Typography, 
  Paper,
  Box,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import { UserService } from '../../services/api';

// Validation schema
const UserRequestSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'Too Short!')
    .max(50, 'Too Long!')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Too Short!')
    .max(50, 'Too Long!')
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  piId: Yup.number()
    .required('Principal Investigator is required'),
  accessLevel: Yup.string()
    .required('Access level is required'),
  startDate: Yup.date()
    .required('Start date is required'),
  endDate: Yup.date()
    .min(Yup.ref('startDate'), 'End date must be after start date')
    .required('End date is required'),
});

const UserRequestForm = ({ initialValues = {}, onSubmit, buttonText = "Submit" }) => {
  const [pis, setPIs] = useState([]);
  
  useEffect(() => {
    const fetchPIs = async () => {
      try {
        const response = await UserService.getPIs();
        setPIs(response.data);
      } catch (error) {
        console.error("Error fetching PIs:", error);
      }
    };
    
    fetchPIs();
  }, []);

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    piId: '',
    accessLevel: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    specialSoftware: '',
    notes: '',
    ...initialValues
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Sponsored User Request
      </Typography>
      
      <Formik
        initialValues={defaultValues}
        validationSchema={UserRequestSchema}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          onSubmit(values);
          setSubmitting(false);
          if (!initialValues.id) {
            resetForm();
          }
        }}
      >
        {({ errors, touched, isSubmitting, handleChange, handleBlur, values }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.firstName && Boolean(errors.firstName)}>
                  <TextField
                    name="firstName"
                    label="First Name"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.firstName && Boolean(errors.firstName)}
                    helperText={touched.firstName && errors.firstName}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.lastName && Boolean(errors.lastName)}>
                  <TextField
                    name="lastName"
                    label="Last Name"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.lastName && Boolean(errors.lastName)}
                    helperText={touched.lastName && errors.lastName}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth error={touched.email && Boolean(errors.email)}>
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.piId && Boolean(errors.piId)}>
                  <InputLabel id="pi-select-label">Principal Investigator</InputLabel>
                  <Select
                    labelId="pi-select-label"
                    id="pi-select"
                    name="piId"
                    value={values.piId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    label="Principal Investigator"
                    error={touched.piId && Boolean(errors.piId)}
                  >
                    <MenuItem value="">
                      <em>Select a PI</em>
                    </MenuItem>
                    {pis.map(pi => (
                      <MenuItem key={pi.id} value={pi.id}>
                        {pi.firstName} {pi.lastName} ({pi.department})
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.piId && errors.piId && <FormHelperText error>{errors.piId}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.accessLevel && Boolean(errors.accessLevel)}>
                  <InputLabel id="access-level-label">Access Level</InputLabel>
                  <Select
                    labelId="access-level-label"
                    id="access-level"
                    name="accessLevel"
                    value={values.accessLevel}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    label="Access Level"
                    error={touched.accessLevel && Boolean(errors.accessLevel)}
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                  {touched.accessLevel && errors.accessLevel && <FormHelperText error>{errors.accessLevel}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.startDate && Boolean(errors.startDate)}>
                  <TextField
                    name="startDate"
                    label="Start Date"
                    type="date"
                    value={values.startDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.startDate && Boolean(errors.startDate)}
                    helperText={touched.startDate && errors.startDate}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.endDate && Boolean(errors.endDate)}>
                  <TextField
                    name="endDate"
                    label="End Date"
                    type="date"
                    value={values.endDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.endDate && Boolean(errors.endDate)}
                    helperText={touched.endDate && errors.endDate}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    name="specialSoftware"
                    label="Special Software Requirements"
                    multiline
                    rows={2}
                    value={values.specialSoftware}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    name="notes"
                    label="Additional Notes"
                    multiline
                    rows={3}
                    value={values.notes}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    {buttonText}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default UserRequestForm;