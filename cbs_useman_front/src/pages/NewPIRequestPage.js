import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, Typography, Box, IconButton, Grid, Paper, RadioGroup, FormControlLabel, Radio, FormLabel, FormControl, Autocomplete } from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { submitRequest, getUserEmail, getAllProjects } from '../api/requests';
import { useAuth } from '../context/AuthContext';
import WesternLayout from '../components/WesternLayout';

const initialPIState = {
  uwo_email: '',
  first_name: '',
  last_name: '',
  department: '',
  phone: '',
  user_type: 'basic',
  existing_project_ids: [],
};

const initialProject = {
  name: '',
  speedcode: '',
  storage_tb: 0,
  description: '',
};

export default function NewPIRequestPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialPIState);
  const [projects, setProjects] = useState([{ ...initialProject }]);
  const [allProjects, setAllProjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  // Track if the user has manually changed the default project name
  const userChangedProjectName = useRef(false);
  const prevLastName = useRef('');

  // Autofill email from backend
  useEffect(() => {
    async function fetchEmailAndProjects() {
      try {
        const [email, projectsList] = await Promise.all([
          getUserEmail(),
          getAllProjects(),
        ]);
        setForm((prev) => ({ ...prev, uwo_email: email }));
        setAllProjects(projectsList);
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchEmailAndProjects();
  }, []);

  // When last name changes, update default project name if not manually changed
  useEffect(() => {
    if (!userChangedProjectName.current && form.last_name) {
      setProjects((prev) => prev.map((proj, idx) => idx === 0 ? { ...proj, name: form.last_name.toLowerCase() } : proj));
    }
    prevLastName.current = form.last_name;
    // eslint-disable-next-line
  }, [form.last_name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectChange = (idx, e) => {
    const { name, value } = e.target;
    setProjects((prev) => prev.map((proj, i) => {
      if (i === idx) {
        // If user changes the default project name, set the flag
        if (idx === 0 && name === 'name') {
          userChangedProjectName.current = true;
        }
        // For storage_tb, ensure only positive values
        if (name === 'storage_tb') {
          const val = Math.max(0, Number(value));
          return { ...proj, [name]: val };
        }
        return { ...proj, [name]: value };
      }
      return proj;
    }));
  };

  const handleExistingProjectsChange = (event, value) => {
    setForm((prev) => ({ ...prev, existing_project_ids: value.map((proj) => proj.id) }));
  };

  const addProject = () => {
    setProjects((prev) => [...prev, { ...initialProject }]);
  };

  const removeProject = (idx) => {
    if (projects.length === 1) return; // Always keep at least one
    setProjects((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitRequest({
        request_type: 'new_pi',
        data: { ...form, projects },
      });
      setSuccess(true);
      setForm(initialPIState);
      setProjects([{ ...initialProject }]);
      userChangedProjectName.current = false;
    } catch (err) {
      setError('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WesternLayout boxWidth={700}>
      <Typography variant="h4" gutterBottom>New PI Account Request</Typography>
      {success && <Typography color="success.main">Request submitted!</Typography>}
      {error && <Typography color="error.main">{error}</Typography>}
      <form onSubmit={handleSubmit}>
        <TextField label="UWO Email Address" name="uwo_email" value={form.uwo_email} onChange={handleChange} fullWidth margin="normal" required
          InputProps={{ readOnly: Boolean(form.uwo_email) }}
        />
        <TextField label="First Name" name="first_name" value={form.first_name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Department/Institution" name="department" value={form.department} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth margin="normal" />
        <FormControl component="fieldset" margin="normal" sx={{ mt: 2 }}>
          <FormLabel component="legend">Account Type</FormLabel>
          <RadioGroup row name="user_type" value={form.user_type} onChange={handleChange}>
            <FormControlLabel value="heavy" control={<Radio />} label="Heavy" />
            <FormControlLabel value="basic" control={<Radio />} label="Basic" />
          </RadioGroup>
        </FormControl>
        <Box mt={3} mb={2}>
          <Typography variant="h6">Projects <small>(at least one required)</small></Typography>
        </Box>
        {projects.map((proj, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField label="Project Name" name="name" value={proj.name} onChange={e => handleProjectChange(idx, e)} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Speedcode" name="speedcode" value={proj.speedcode} onChange={e => handleProjectChange(idx, e)} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField label="Storage (TB)" name="storage_tb" value={proj.storage_tb} onChange={e => handleProjectChange(idx, e)} fullWidth type="number" inputProps={{ min: 0, step: 1 }} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField label="Description" name="description" value={proj.description} onChange={e => handleProjectChange(idx, e)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton onClick={() => removeProject(idx)} disabled={projects.length === 1} color="error" aria-label="Remove project">
                  <RemoveCircle />
                </IconButton>
                {idx === projects.length - 1 && (
                  <IconButton onClick={addProject} color="primary" aria-label="Add project">
                    <AddCircle />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          </Paper>
        ))}
        <Autocomplete
          multiple
          options={allProjects}
          getOptionLabel={(option) => option.name}
          onChange={handleExistingProjectsChange}
          value={allProjects.filter(p => form.existing_project_ids.includes(p.id))}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" label="Request Access to Existing Projects" margin="normal" fullWidth />
          )}
          sx={{ mt: 2, mb: 2 }}
        />
        <Box mt={2}>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>Submit</Button>
        </Box>
      </form>
    </WesternLayout>
  );
} 