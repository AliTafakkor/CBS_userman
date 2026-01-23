// src/components/forms/PIRequestForm.js
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { 
  Button, 
  TextField, 
  FormControl, 
  FormHelperText, 
  Grid, 
  Typography, 
  Paper,
  Box
} from '@mui/material';

// Validation schema
const PIRequestSchema = Yup.object().shape({
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
  department: Yup.string()
    .required('Department is required'),
  fundingSource: Yup.string()
    .required('Funding source is required'),
  projectTitle: Yup.string()
    .required('Project title is required'),
  endDate: Yup.date()
    .min(new Date(), 'End date must be in the future')
    .required('End date is required'),
});

const PIRequestForm = ({ initialValues = {}, onSubmit, buttonText = "Submit" }) => {
  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    fundingSource: '',
    projectTitle: '',
    endDate: '',
    notes: '',
    ...initialValues
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Principal Investigator Request
      </Typography>
      
      <Formik
        initialValues={defaultValues}
        validationSchema={PIRequestSchema}
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
                <FormControl fullWidth error={touched.department && Boolean(errors.department)}>
                  <TextField
                    name="department"
                    label="Department"
                    value={values.department}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.department && Boolean(errors.department)}
                    helperText={touched.department && errors.department}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.fundingSource && Boolean(errors.fundingSource)}>
                  <TextField
                    name="fundingSource"
                    label="Funding Source"
                    value={values.fundingSource}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.fundingSource && Boolean(errors.fundingSource)}
                    helperText={touched.fundingSource && errors.fundingSource}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth error={touched.projectTitle && Boolean(errors.projectTitle)}>
                  <TextField
                    name="projectTitle"
                    label="Project Title"
                    value={values.projectTitle}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.projectTitle && Boolean(errors.projectTitle)}
                    helperText={touched.projectTitle && errors.projectTitle}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.endDate && Boolean(errors.endDate)}>
                  <TextField
                    name="endDate"
                    label="Project End Date"
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
                    name="notes"
                    label="Additional Notes"
                    multiline
                    rows={4}
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

export default PIRequestForm;