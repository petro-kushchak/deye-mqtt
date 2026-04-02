import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const PowerGauge = ({ value, max, label, unit, color, size = 120, thickness = 8 }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * ((size - thickness) / 2);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        sx={{
          color: 'grey.800',
          position: 'absolute',
        }}
        size={size}
        thickness={thickness}
      />
      <CircularProgress
        variant="determinate"
        value={percentage}
        sx={{
          color: color,
          position: 'absolute',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
            transition: 'stroke-dashoffset 0.5s ease',
          },
        }}
        size={size}
        thickness={thickness}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {value.toFixed(0)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {unit}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default PowerGauge;
