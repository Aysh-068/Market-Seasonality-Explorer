import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Divider, List, ListItem, ListItemText } from '@mui/material';
import { setupBinanceOrderBookWebSocket, getBinanceData } from '../services/binanceService';
import { calculateSMA, calculateRSI } from '../utils/technicalIndicators'; // Will create this file

export default function DashboardPanel({ dateData, symbol, onClose }) { // Pass symbol as prop
    const { time, open, high, low, close, volume, change, volatility, _raw } = dateData;

    const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
    const [technicalIndicators, setTechnicalIndicators] = useState(null);

    useEffect(() => {
        // Setup WebSocket for order book when component mounts or symbol changes
        const cleanupWs = setupBinanceOrderBookWebSocket(symbol, (newOrderBook) => {
            setOrderBook(newOrderBook);
        });

        // Fetch additional data for technical indicators if needed
        // For SMA/RSI, we need more than just one day's data, so fetch e.g., last 50 days
        const fetchIndicatorsData = async () => {
            // Adjust limit as needed for indicator calculation (e.g., 50 for SMA/RSI)
            const historicalPrices = await getBinanceData(symbol, '1d', 50);
            const closes = historicalPrices.map(d => d.close);
            const smas = {
                '10_day_sma': calculateSMA(closes, 10),
                '20_day_sma': calculateSMA(closes, 20),
            };
            const rsi = calculateRSI(closes, 14);

            setTechnicalIndicators({
                sma10: smas['10_day_sma'],
                sma20: smas['20_day_sma'],
                rsi14: rsi,
            });
        };
        fetchIndicatorsData();


        // Cleanup WebSocket when component unmounts or symbol changes
        return () => {
            cleanupWs();
        };
    }, [symbol]); // Re-run effect if symbol changes

    return (
        <Box sx={{ p: 2, width: 300, overflowY: 'auto', maxHeight: '100vh' }}>
            <Typography variant="h6" gutterBottom>Detailed Metrics</Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body1">
                <strong>Date:</strong> {new Date(time).toDateString()}
            </Typography>
            <Typography><strong>Symbol:</strong> {symbol}</Typography>
            <Typography><strong>Open:</strong> {open?.toFixed(2)}</Typography>
            <Typography><strong>Close:</strong> {close?.toFixed(2)}</Typography>
            <Typography><strong>High:</strong> {high?.toFixed(2)}</Typography>
            <Typography><strong>Low:</strong> {low?.toFixed(2)}</Typography>
            <Typography><strong>Price Change:</strong> {change?.toFixed(2)}%</Typography>
            <Typography><strong>Volatility (Avg Daily Range %):</strong> {volatility?.toFixed(2)}%</Typography>
            <Typography><strong>Volume:</strong> {Math.round(volume).toLocaleString()}</Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Technical Indicators</Typography>
            {technicalIndicators ? (
                <>
                    <Typography><strong>10-Day SMA:</strong> {technicalIndicators.sma10?.toFixed(2)}</Typography>
                    <Typography><strong>20-Day SMA:</strong> {technicalIndicators.sma20?.toFixed(2)}</Typography>
                    <Typography><strong>14-Day RSI:</strong> {technicalIndicators.rsi14?.toFixed(2)}</Typography>
                    {/* Add more indicators as needed */}
                </>
            ) : (
                <Typography>Loading indicators...</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Real-time Order Book</Typography>
            <Box display="flex" justifyContent="space-around" gap={1}>
                <Box>
                    <Typography variant="subtitle2" color="success.main">Bids</Typography>
                    <List dense disablePadding sx={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #eee' }}>
                        {orderBook.bids.slice(0, 10).map((bid, index) => ( // Display top 10 bids
                            <ListItem key={index} sx={{ py: 0.2 }}>
                                <ListItemText primary={`${bid.price.toFixed(4)}`} secondary={`${bid.quantity.toFixed(4)}`} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="error.main">Asks</Typography>
                    <List dense disablePadding sx={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #eee' }}>
                        {orderBook.asks.slice(0, 10).map((ask, index) => ( // Display top 10 asks
                            <ListItem key={index} sx={{ py: 0.2 }}>
                                <ListItemText primary={`${ask.price.toFixed(4)}`} secondary={`${ask.quantity.toFixed(4)}`} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Box>

            <Button variant="outlined" sx={{ mt: 2 }} onClick={onClose} fullWidth>
                Close
            </Button>
        </Box>
    );
}