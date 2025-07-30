import React, { useEffect, useState } from 'react';
import { getBinanceData } from '../services/binanceService';
import {
  format,
  startOfMonth,
  addMonths,
  subMonths,
  isSameMonth
} from 'date-fns';
import isToday from 'date-fns/isToday';
import { groupByPeriod } from '../utils/aggregateUtils';
import {
  exportCalendarAsPDF,
  exportDataAsCSV,
  exportCalendarAsPNG
} from '../utils/exportUtils';

import DashboardPanel from './DashboardPanel';
import VolatilityChart from './VolatilityChart';

import {
  Grid,
  Paper,
  Tooltip,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Drawer,
  IconButton,
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function CalendarView() {
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeframe, setTimeframe] = useState('daily');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [metric, setMetric] = useState('volatility');
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [colorblindMode, setColorblindMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(4000);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedCellData, setSelectedCellData] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    (async () => {
      const res = await getBinanceData(symbol, '1d', 365);
      setData(res);
    })();
  }, [symbol]);

  const handleTimeframeChange = (_, newTimeframe) => {
    if (newTimeframe) setTimeframe(newTimeframe);
  };

  const handleDateSelect = (d) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(d);
      setRangeEnd(null);
    } else {
      if (d.time < rangeStart.time) {
        setRangeEnd(rangeStart);
        setRangeStart(d);
      } else {
        setRangeEnd(d);
      }
    }
    setSelectedCellData(d);
  };

  const handleMonthNavigation = (direction) => {
    setCurrentMonth(prev =>
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const groupedData = groupByPeriod(data, timeframe).filter((d) => {
    const date = new Date(d.time);
    return isSameMonth(date, currentMonth);
  });

  const getCellColor = (volatility) => {
    if (colorblindMode) {
      return volatility > 50 ? '#000' : volatility > 20 ? '#777' : '#ccc';
    } else if (highContrast) {
      return volatility > 50 ? '#000' : volatility > 20 ? '#555' : '#fff';
    } else {
      return volatility > 50 ? '#e53935' : volatility > 20 ? '#fdd835' : '#66bb6a';
    }
  };

  const getTextColor = (bgColor) => {
    return ['#fdd835', '#ffeb3b', '#fff', '#ccc', '#66bb6a'].includes(bgColor)
      ? '#000'
      : '#fff';
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
      >
        <Button onClick={() => handleMonthNavigation('prev')}>
          Previous Month
        </Button>
        <Typography variant="h6">{format(currentMonth, 'MMMM yyyy')}</Typography>
        <Button onClick={() => handleMonthNavigation('next')}>
          Next Month
        </Button>
      </Box>

      <Box
        display="flex"
        justifyContent="center"
        mb={2}
        gap={2}
        flexWrap="wrap"
      >
        <ToggleButtonGroup
          value={timeframe}
          exclusive
          onChange={handleTimeframeChange}
          aria-label="timeframe"
        >
          <ToggleButton value="daily">Daily</ToggleButton>
          <ToggleButton value="weekly">Weekly</ToggleButton>
          <ToggleButton value="monthly">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
        <FormControlLabel
          control={
            <Checkbox
              checked={colorblindMode}
              onChange={() => setColorblindMode(!colorblindMode)}
            />
          }
          label="Colorblind Friendly"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={highContrast}
              onChange={() => setHighContrast(!highContrast)}
            />
          }
          label="High Contrast"
        />
      </Box>

      <div
        id="calendar-container"
        style={{
          borderRadius: 12,
          padding: 12,
          background: '#f9f9f9',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)'
        }}
      >
        <Grid container spacing={1} justifyContent="center">
          {groupedData.map((d, i) => {
            const bgColor = getCellColor(d.volatility);
            const textColor = getTextColor(bgColor);
            const isInRange =
              rangeStart &&
              d.time >= rangeStart.time &&
              (!rangeEnd || d.time <= rangeEnd.time);

            return (
              <Grid
                item
                xs={6}
                sm={3}
                md={1.5}
                key={i}
                style={{ display: 'flex', justifyContent: 'center' }}
              >
                <Tooltip
                  title={
                    <Box>
                      <Typography>
                        Date:{' '}
                        {format(
                          new Date(d.time),
                          timeframe === 'monthly' ? 'MMM yyyy' : 'yyyy-MM-dd'
                        )}
                      </Typography>
                      <Typography>
                        Volatility: {d.volatility.toFixed(2)}%
                      </Typography>
                      <Typography>
                        Volume: {Math.round(d.volume).toLocaleString()}
                      </Typography>
                      <Typography>Change: {d.change.toFixed(2)}%</Typography>
                      {d.open && <Typography>Open: {d.open.toFixed(2)}</Typography>}
                      {d.high && <Typography>High: {d.high.toFixed(2)}</Typography>}
                      {d.low && <Typography>Low: {d.low.toFixed(2)}</Typography>}
                      {d.close && (
                        <Typography>Close: {d.close.toFixed(2)}</Typography>
                      )}
                    </Box>
                  }
                >
                  <Paper
                    component="button"
                    role="button"
                    tabIndex={0}
                    elevation={4}
                    onClick={() => handleDateSelect(d)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDateSelect(d);
                        e.stopPropagation();
                      }
                    }}
                    aria-label={`Date: ${format(
                      new Date(d.time),
                      'MMM d'
                    )}, Volatility: ${d.volatility.toFixed(2)}%, Volume: ${
                      d.volume
                    }, Change: ${d.change.toFixed(2)}%`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      minHeight: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 1.2,
                      backgroundColor: bgColor,
                      border: isToday(new Date(d.time))
                        ? '2px dashed #1976d2'
                        : isInRange
                        ? '2px solid #1976d2'
                        : 'none',
                      cursor: 'pointer',
                      color: textColor,
                      transition:
                        'transform 0.2s ease, background-color 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      },
                      borderRadius: 2,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2">
                      {timeframe === 'weekly'
                        ? `Week of ${format(new Date(d.time), 'MMM d')}`
                        : format(new Date(d.time), 'MMM d')}
                    </Typography>
                    <Typography variant="caption">
                      Vol: {Math.round(d.volume).toLocaleString()}
                    </Typography>
                    <Typography variant="caption">
                      {d.change > 0.01
                        ? '▲'
                        : d.change < -0.01
                        ? '▼'
                        : '•'}{' '}
                      {d.change.toFixed(2)}%
                    </Typography>
                    {d.volatility > alertThreshold && (
                      <Typography variant="caption" color="error">
                        ⚠️ Alert
                      </Typography>
                    )}
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </div>

      <Drawer
        anchor="right"
        open={!!selectedCellData}
        onClose={() => setSelectedCellData(null)}
        PaperProps={{
          sx: { width: isMobile ? '100%' : 300 }
        }}
      >
        <Box p={2} role="presentation">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Details</Typography>
            <IconButton onClick={() => setSelectedCellData(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
          {selectedCellData && (
            <DashboardPanel
              dateData={selectedCellData}
              symbol={symbol}
              onClose={() => setSelectedCellData(null)}
            />
          )}
        </Box>
      </Drawer>

      <Box mt={{ xs: 2, sm: 4 }} px={{ xs: 1, sm: 3 }}>
        <VolatilityChart data={groupedData} metric={metric} />
      </Box>

      <Box
        display="flex"
        gap={2}
        mt={2}
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
      >
        <FormControl>
          <InputLabel>Symbol</InputLabel>
          <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <MenuItem value="BTCUSDT">BTC</MenuItem>
            <MenuItem value="ETHUSDT">ETH</MenuItem>
            <MenuItem value="BNBUSDT">BNB</MenuItem>
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Metric</InputLabel>
          <Select value={metric} onChange={(e) => setMetric(e.target.value)}>
            <MenuItem value="volatility">Volatility</MenuItem>
            <MenuItem value="volume">Volume</MenuItem>
            <MenuItem value="change">Price Change</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        display="flex"
        justifyContent="center"
        gap={2}
        mt={2}
        flexWrap="wrap"
      >
        <Button
          variant="contained"
          onClick={() => exportCalendarAsPDF('calendar-container')}
        >
          Export PDF
        </Button>
        <Button variant="contained" onClick={() => exportDataAsCSV(data)}>
          Export CSV
        </Button>
        <Button
          variant="contained"
          onClick={() => exportCalendarAsPNG('calendar-container')}
        >
          Export PNG
        </Button>
      </Box>
    </>
  );
}
