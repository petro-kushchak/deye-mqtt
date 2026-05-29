import {
  Box, Grid, Typography, Alert, Collapse, IconButton, Tabs, Tab,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import GridOnIcon from '@mui/icons-material/GridOn';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';

import { useTheme } from '../context/ThemeContext';
import { useInverter } from '../context/InverterContext';
import EnergyFlow from './EnergyFlow';
import EnergyHistory from './EnergyHistory';
import StatCard from './StatCard';
import PVStrings from './PVStrings';
import SystemInfo from './SystemInfo';
import { formatPower, getGridStatus, getBatteryStatusLabel, getBatteryStatusColor } from '../utils/formatters';
import type { FacilityState } from '../types';

interface FacilityDashboardProps {
  facility: FacilityState;
  openPower: boolean;
  openHistory: boolean;
  openPV: boolean;
  openStats: boolean;
  onTogglePower: () => void;
  onToggleHistory: () => void;
  onTogglePV: () => void;
  onToggleStats: () => void;
}

function SectionHeader({ title, icon, open, onToggle, storageKey }: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  storageKey: string;
}) {
  const { colors } = useTheme();
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer', borderBottom: 1, borderColor: 'divider', pb: 1 }}
      onClick={() => { onToggle(); localStorage.setItem(storageKey, (!open).toString()); }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
        {icon}
        <Typography variant="subtitle1">
          {title}
        </Typography>
      </Box>
      <IconButton size="small" sx={{ color: colors.textSecondary }}>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Box>
  );
}

export default function FacilityDashboard({ facility, openPower, openHistory, openPV, openStats, onTogglePower, onToggleHistory, onTogglePV, onToggleStats }: FacilityDashboardProps) {
  const { colors } = useTheme();
  const { selectFacilityInverter } = useInverter();

  const { currentInverter, inverterSerials, selectedInverter } = facility;

  if (!facility.hasMetrics || !currentInverter) {
    return (
      <Alert
        severity="warning"
        sx={{ mb: 3 }}
        icon={<WarningAmberIcon fontSize="inherit" />}
      >
        {facility.connected
          ? `No inverter data available for ${facility.config.facilityName}. Make sure the inverter is connected.`
          : `${facility.config.facilityName} is disconnected. Waiting for connection...`}
      </Alert>
    );
  }

  const gridStatus = getGridStatus(currentInverter.grid_power);
  const phases = currentInverter.phases ?? 3;
  const loadSubLabel = [
    ...(phases >= 1 ? [`L1: ${formatPower(currentInverter.load_power_l1)}W`] : []),
    ...(phases >= 2 ? [`L2: ${formatPower(currentInverter.load_power_l2)}W`] : []),
    ...(phases >= 3 ? [`L3: ${formatPower(currentInverter.load_power_l3)}W`] : []),
  ].join(' | ');
  const batteryPower = currentInverter.battery_power;
  const batteryLabel = getBatteryStatusLabel(batteryPower);
  const batteryColor = getBatteryStatusColor(batteryPower);

  const facilityIndex = useFacilityIndex(facility);

  return (
    <Grid container spacing={3} sx={{ border: `1px solid ${colors.border}`, borderRadius: 1, p: 2 }}>
      {inverterSerials.length > 1 && (
        <Grid item xs={12}>
          <Tabs
            value={selectedInverter}
            onChange={(_e, val) => selectFacilityInverter(facilityIndex, val)}
            sx={{ bgcolor: 'transparent', minHeight: 40, mb: 1 }}
            textColor="primary"
            indicatorColor="primary"
          >
            {inverterSerials.map((serial) => (
              <Tab
                key={serial}
                value={serial}
                label={serial.slice(-6)}
                sx={{ minHeight: 40, fontSize: '0.8rem' }}
              />
            ))}
          </Tabs>
        </Grid>
      )}

      <Grid item xs={12}>
        <SectionHeader title="Power Overview" icon={<ElectricBoltIcon sx={{ color: colors.warning }} />} open={openPower} onToggle={onTogglePower} storageKey="deye-section-power" />
      </Grid>

      <Collapse in={openPower} sx={{ width: '100%' }}>
        <Grid container spacing={3} sx={{ pl: 2, pr: 2 }}>
          <Grid item xs={12} md={6} lg={3}>
            <StatCard
              icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
              label="Solar Production"
              value={formatPower(currentInverter.pv_power)}
              unit="W"
              color={colors.warning}
              subLabel={`PV1: ${formatPower(currentInverter.pv1_power)}W | PV2: ${formatPower(currentInverter.pv2_power)}W`}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StatCard
              icon={<BatteryChargingFullIcon sx={{ fontSize: 40 }} />}
              label="Battery"
              value={formatPower(Math.abs(batteryPower))}
              unit="W"
              color={batteryColor}
              subLabel={`SOC: ${formatPower(currentInverter.battery_soc)}% | ${batteryLabel}`}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StatCard
              icon={<GridOnIcon sx={{ fontSize: 40 }} />}
              label="Grid"
              value={formatPower(Math.abs(currentInverter.grid_power))}
              unit="W"
              color={gridStatus.color}
              subLabel={gridStatus.label}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StatCard
              icon={<HomeIcon sx={{ fontSize: 40 }} />}
              label="Home Load"
              value={formatPower(currentInverter.total_load_power)}
              unit="W"
              color={colors.info}
              subLabel={loadSubLabel || 'Current consumption'}
            />
          </Grid>

          <Grid item xs={12} xl={8}>
            <EnergyFlow data={currentInverter} />
          </Grid>

          <Grid item xs={12} xl={4}>
            <SystemInfo />
          </Grid>
        </Grid>
      </Collapse>

      <Grid item xs={12}>
        <SectionHeader title="Energy History" icon={<HistoryIcon sx={{ color: colors.info }} />} open={openHistory} onToggle={onToggleHistory} storageKey="deye-section-history" />
      </Grid>
      <EnergyHistory open={openHistory} />

      <Grid item xs={12}>
        <SectionHeader title="PV Strings" icon={<SolarPowerIcon sx={{ color: colors.warning }} />} open={openPV} onToggle={onTogglePV} storageKey="deye-section-pv" />
      </Grid>

      <Collapse in={openPV} sx={{ width: '100%' }}>
        <PVStrings />
      </Collapse>

      <Grid item xs={12}>
        <SectionHeader title="Energy Statistics" icon={<BarChartIcon sx={{ color: colors.info }} />} open={openStats} onToggle={onToggleStats} storageKey="deye-section-stats" />
      </Grid>

      <Collapse in={openStats} sx={{ width: '100%' }}>
        <Grid container spacing={3} sx={{ pl: 2, pr: 2 }}>
          <Grid item xs={12} md={6} lg={3}>
            <StatCard
              icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
              label="Daily Production"
              value={formatPower(currentInverter['daily_production'])}
              unit="kWh"
              color={colors.warning}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StatCard
              icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
              label="Total Production"
              value={formatPower(((currentInverter['total_production'] ?? 0) / 1000))}
              unit="MWh"
              color={colors.warning}
              subLabel="All time"
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StatCard
              icon={<HomeIcon sx={{ fontSize: 40 }} />}
              label="Daily Load"
              value={formatPower(currentInverter['daily_load_consumption'])}
              unit="kWh"
              color={colors.info}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <StatCard
              icon={<BatteryChargingFullIcon sx={{ fontSize: 40 }} />}
              label="Daily Battery Charge"
              value={formatPower(currentInverter['daily_battery_charge'])}
              unit="kWh"
              color={colors.success}
            />
          </Grid>
        </Grid>
      </Collapse>
    </Grid>
  );
}

function useFacilityIndex(target: FacilityState): number {
  const { facilities } = useInverter();
  return facilities.findIndex((f) => f.config.facilityName === target.config.facilityName);
}
