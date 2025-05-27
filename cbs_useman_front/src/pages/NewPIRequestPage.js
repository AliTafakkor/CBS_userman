import React, { useState } from 'react';
import { TextField, Button, Typography, Box, FormControlLabel, Checkbox, Radio, RadioGroup, FormLabel, FormControl } from '@mui/material';
import { submitRequest } from '../api/requests';

const initialState = {
  uwo_email: '',
  first_name: '',
  last_name: '',
  storage_tb: '',
  power_user: false,
  speed_code: '',
  description: '',
  secure_groups: '',
  robarts_login: '',
};

export default function NewPIRequestPage() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRadio = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitRequest({
        request_type: 'new_pi',
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
    <Box maxWidth={600} mx="auto" mt={4}>
      <Typography variant="h4" gutterBottom>New PI Account Request</Typography>
      {success && <Typography color="success.main">Request submitted!</Typography>}
      {error && <Typography color="error.main">{error}</Typography>}
      <form onSubmit={handleSubmit}>
        <TextField label="UWO Email Address" name="uwo_email" value={form.uwo_email} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="First Name" name="first_name" value={form.first_name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Required Storage (TB)" name="storage_tb" value={form.storage_tb} onChange={handleChange} fullWidth margin="normal" required type="number" />
        <FormControlLabel control={<Checkbox checked={form.power_user} onChange={handleChange} name="power_user" />} label="Power User Account? (Fee applies)" />
        <TextField label="Speed Code" name="speed_code" value={form.speed_code} onChange={handleChange} fullWidth margin="normal" required />
        <TextField label="Brief Description of Server Use" name="description" value={form.description} onChange={handleChange} fullWidth margin="normal" multiline rows={2} required />
        <TextField label="Need Separate Secure Access Groups? (Project Names)" name="secure_groups" value={form.secure_groups} onChange={handleChange} fullWidth margin="normal" />
        <FormControl component="fieldset" margin="normal">
          <FormLabel component="legend">Already have a Robarts login?</FormLabel>
          <RadioGroup row name="robarts_login" value={form.robarts_login} onChange={handleRadio}>
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
        <Box mt={2}>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>Submit</Button>
        </Box>
      </form>
    </Box>
  );
} 