import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Autocomplete, RadioGroup, FormControlLabel, Radio, FormLabel, FormControl } from '@mui/material';
import WesternLayout from '../components/WesternLayout';
import { submitRequest, getAllPIs, getAllProjects, getUserEmail } from '../api/requests';

const initialState = {
  uwo_email: '',
  first_name: '',
  last_name: '',
  department: '',
  phone: '',
  pi_id: null,
  project_id: null,
  reason: '',
  user_type: 'basic',
  contract_end: '',
};

export default function NewSponsoredUserRequestPage() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pis, setPIs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [piList, projectList, email] = await Promise.all([
          getAllPIs(),
          getAllProjects(),
          getUserEmail(),
        ]);
        setPIs(piList);
        setProjects(projectList);
        setForm((prev) => ({ ...prev, uwo_email: email }));
      } catch (e) {
        setError('Failed to load PI, project list, or email.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePIChange = (event, value) => {
    setForm((prev) => ({ ...prev, pi_id: value ? value.id : null }));
  };

  const handleProjectChange = (event, value) => {
    setForm((prev) => ({ ...prev, project_id: value ? value.id : null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitRequest({
        request_type: 'new_user',
        data: form,
      });
      setSuccess(true);
      setForm(initialState);
    } catch (err) {
      setError('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WesternLayout boxWidth={600}>
      <Typography variant="h4" gutterBottom>Sponsored User Account Request</Typography>
      {success && <Typography color="success.main">Request submitted!</Typography>}
      {error && <Typography color="error.main">{error}</Typography>}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <TextField label="UWO Email Address" name="uwo_email" value={form.uwo_email} onChange={handleChange} fullWidth margin="normal" required
            InputProps={{ readOnly: Boolean(form.uwo_email) }}
          />
          <TextField label="First Name" name="first_name" value={form.first_name} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Department/Institution" name="department" value={form.department} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth margin="normal" />
          <TextField
            label="Contract End Date"
            name="contract_end"
            type="date"
            value={form.contract_end}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <Autocomplete
            options={pis}
            getOptionLabel={(option) => option.name}
            onChange={handlePIChange}
            value={pis.find(pi => pi.id === form.pi_id) || null}
            renderInput={(params) => (
              <TextField {...params} label="Principal Investigator (PI)" margin="normal" required fullWidth />
            )}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={projects}
            getOptionLabel={(option) => option.name}
            onChange={handleProjectChange}
            value={projects.find(p => p.id === form.project_id) || null}
            renderInput={(params) => (
              <TextField {...params} label="Project" margin="normal" required fullWidth />
            )}
            sx={{ mb: 2 }}
          />
          <TextField label="Reason for Access" name="reason" value={form.reason} onChange={handleChange} fullWidth margin="normal" multiline rows={2} required />
          <FormControl component="fieldset" margin="normal" sx={{ mt: 2 }}>
            <FormLabel component="legend">Account Type</FormLabel>
            <RadioGroup row name="user_type" value={form.user_type} onChange={handleChange}>
              <FormControlLabel value="heavy" control={<Radio />} label="Heavy" />
              <FormControlLabel value="basic" control={<Radio />} label="Basic" />
            </RadioGroup>
          </FormControl>
          <Box mt={2}>
            <Button type="submit" variant="contained" color="primary" disabled={submitting} fullWidth>Submit</Button>
          </Box>
        </form>
      )}
    </WesternLayout>
  );
} 