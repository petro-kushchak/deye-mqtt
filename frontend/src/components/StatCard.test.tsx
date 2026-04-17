import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import StatCard from '../components/StatCard';
import SolarPowerIcon from '@mui/icons-material/SolarPower';

describe('StatCard', () => {
  it('should render with label and value', () => {
    render(
      <StatCard
        icon={<SolarPowerIcon />}
        label="Solar Production"
        value={1500}
        unit="W"
        color="#ff9800"
      />
    );

    expect(screen.getByText('Solar Production')).toBeDefined();
    expect(screen.getByText(/1500/)).toBeDefined();
    expect(screen.getByText('W')).toBeDefined();
  });

  it('should render with subLabel', () => {
    render(
      <StatCard
        icon={<SolarPowerIcon />}
        label="Battery"
        value={80}
        unit="%"
        color="#4caf50"
        subLabel="SOC: 80%"
      />
    );

    expect(screen.getByText('SOC: 80%')).toBeDefined();
  });

  it('should format number value with toFixed', () => {
    render(
      <StatCard
        icon={<SolarPowerIcon />}
        label="Power"
        value={123.456}
        unit="W"
        color="#ff9800"
      />
    );

    expect(screen.getByText(/123\.5/)).toBeDefined();
  });

  it('should render string value as-is', () => {
    render(
      <StatCard
        icon={<SolarPowerIcon />}
        label="Status"
        value="N/A"
        unit=""
        color="#9e9e9e"
      />
    );

    expect(screen.getByText('N/A')).toBeDefined();
  });
});