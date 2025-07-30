// src/utils/aggregateUtils.js

import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function groupByPeriod(data, timeframe) {
  if (!data || data.length === 0) return [];

  const groups = {};

  data.forEach(entry => {
    const date = new Date(entry.time);
    let key;

    switch (timeframe) {
      case 'weekly':
        key = `${startOfWeek(date, { weekStartsOn: 0 }).toISOString().split('T')[0]}_${endOfWeek(date, { weekStartsOn: 0 }).toISOString().split('T')[0]}`;
        break;
      case 'monthly':
        key = `${startOfMonth(date).toISOString().split('T')[0]}_${endOfMonth(date).toISOString().split('T')[0]}`;
        break;
      default: // daily
        key = date.toISOString().split('T')[0];
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  });

  return Object.entries(groups).map(([key, entries]) => {
    const time = entries[0].time;
    const volume = entries.reduce((sum, d) => sum + d.volume, 0);
    // For change, it's often more meaningful to calculate change from first open to last close in the period
    const startOpen = entries[0].open;
    const endClose = entries[entries.length - 1].close;
    const change = ((endClose - startOpen) / startOpen) * 100;

    const high = Math.max(...entries.map(d => d.high));
    const low = Math.min(...entries.map(d => d.low));

    // For aggregated volatility, you might take the average of daily volatilities or a different measure
    // Here, average of daily percentage volatilities is used
    const volatility = entries.reduce((sum, d) => sum + d.volatility, 0) / entries.length;

    // You might also want to store the actual date range for weekly/monthly for display
    let periodStartDisplay = new Date(entries[0].time);
    let periodEndDisplay = new Date(entries[entries.length - 1].time);

    return {
      time, // This might represent the start of the period for consistent charting
      open: startOpen,
      close: endClose,
      high,
      low,
      volume,
      change,
      volatility,
      // Add more aggregated data points if needed for dashboard panel
      _rawEntries: entries, // Keep raw entries for potential deeper analysis in dashboard
      periodStartDisplay,
      periodEndDisplay
    };
  });
}