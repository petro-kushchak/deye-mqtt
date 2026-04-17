import { Card, CardContent, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: string;
  subLabel?: string;
}

const StatCard = ({ icon, label, value, unit, color, subLabel }: StatCardProps) => {
  const { colors } = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${colors.cardAlt} 100%)`,
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 20px ${color}30`,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5, color: colors.textSecondary }}>
              {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text }}>
                {typeof value === 'number' ? value.toFixed(1) : value}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {unit}
              </Typography>
            </Box>
            {subLabel && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: colors.textSecondary }}>
                {subLabel}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color, opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;