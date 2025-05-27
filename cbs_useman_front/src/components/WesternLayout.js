import React from 'react';
import { Box, Paper } from '@mui/material';
import westernLogo from '../logo.svg'; // Replace with actual Western logo if available

export default function WesternLayout({ children, boxWidth = 400, animationDuration = '40s' }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Western background */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: 'linear-gradient(-45deg, #4F2683, #8F55E0, #201436, #4F2683)',
          backgroundSize: '400% 400%',
          animation: `gradientBG ${animationDuration} ease infinite`,
        }}
      />
      <Paper
        elevation={6}
        sx={{
          zIndex: 1,
          p: 4,
          width: boxWidth,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 8px 32px 0 rgba(79, 38, 131, 0.15)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid #4F2683',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img src={westernLogo} alt="Western University Logo" style={{ height: 60, marginBottom: 24 }} />
        {children}
      </Paper>
      <style>
        {`
          @keyframes gradientBG {
            0% {background-position: 0% 50%;}
            50% {background-position: 100% 50%;}
            100% {background-position: 0% 50%;}
          }
        `}
      </style>
    </Box>
  );
} 