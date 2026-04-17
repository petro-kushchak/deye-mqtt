import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnergyFlow from '../components/EnergyFlow';

describe('EnergyFlow', () => {
  const mockData = {
    pv_power: 5000,
    pv1_power: 2500,
    pv2_power: 2500,
    battery_power: -1000,
    battery_soc: 75,
    grid_power: -200,
    total_load_power: 3500,
  };

  it('should render energy flow diagram', () => {
    render(<EnergyFlow data={mockData} />);

    expect(screen.getByText('Energy Flow')).toBeDefined();
    expect(screen.getByText('PV')).toBeDefined();
    expect(screen.getByText('Battery')).toBeDefined();
    expect(screen.getByText('Grid')).toBeDefined();
    expect(screen.getByText('Load')).toBeDefined();
    expect(screen.getByText('Inverter')).toBeDefined();
  });

  it('should display power values', () => {
    render(<EnergyFlow data={mockData} />);

    expect(screen.getByText('5000')).toBeDefined();
    expect(screen.getByText('1000')).toBeDefined();
    expect(screen.getByText('3500')).toBeDefined();
  });

  it('should show SOC percentage', () => {
    render(<EnergyFlow data={mockData} />);

    expect(screen.getByText('SOC: 75%')).toBeDefined();
  });

  it('should show grid subvalue (Export/Import/Idle)', () => {
    render(<EnergyFlow data={mockData} />);

    expect(screen.getByText('Export')).toBeDefined();
  });

  it('should handle empty data', () => {
    const { container } = render(<EnergyFlow data={{}} />);

    expect(container.querySelector('.MuiCard-root')).toBeDefined();
  });

  it('should display PV breakdown', () => {
    render(<EnergyFlow data={mockData} />);

    expect(screen.getByText('2500W + 2500W')).toBeDefined();
  });
});