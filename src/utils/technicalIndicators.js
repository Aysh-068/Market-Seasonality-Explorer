// src/utils/technicalIndicators.js

// Simple Moving Average (SMA)
export const calculateSMA = (prices, period) => {
    if (!prices || prices.length < period) {
        return NaN; // Not enough data
    }
    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
};

// Relative Strength Index (RSI)
// This is a simplified RSI calculation for demonstration.
// For production, consider a more robust library or implementation.
export const calculateRSI = (prices, period) => {
    if (!prices || prices.length <= period) {
        return NaN; // Not enough data
    }

    const gains = [];
    const losses = [];

    // Calculate initial gains and losses for the first 'period'
    for (let i = 1; i <= period; i++) {
        const diff = prices[prices.length - period + i - 1] - prices[prices.length - period + i - 2];
        if (diff > 0) {
            gains.push(diff);
            losses.push(0);
        } else {
            gains.push(0);
            losses.push(Math.abs(diff));
        }
    }

    let avgGain = gains.reduce((sum, g) => sum + g, 0) / period;
    let avgLoss = losses.reduce((sum, l) => sum + l, 0) / period;

    // Calculate subsequent average gains and losses (smoothed)
    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        let currentGain = 0;
        let currentLoss = 0;
        if (diff > 0) {
            currentGain = diff;
        } else {
            currentLoss = Math.abs(diff);
        }

        avgGain = ((avgGain * (period - 1)) + currentGain) / period;
        avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
    }

    if (avgLoss === 0) {
        return 100; // No losses, RSI is 100
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

// You can add more indicators here (e.g., Bollinger Bands, MACD)