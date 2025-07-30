import axios from 'axios';

// Function to fetch historical Klines data
export async function getBinanceData(symbol = 'BTCUSDT', interval = '1d', limit = 30) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    try {
        const res = await axios.get(url);
        return res.data.map(k => {
            const open = parseFloat(k[1]);
            const high = parseFloat(k[2]);
            const low = parseFloat(k[3]);
            const close = parseFloat(k[4]);
            const volume = parseFloat(k[5]);
            const change = ((close - open) / open) * 100;
            // Simple volatility as High-Low range. For a more robust metric, consider Standard Deviation of returns.
            const volatility = high - low; // This is absolute price difference, not relative volatility

            // For volatility in percentage: (High - Low) / Low * 100
            const percentageVolatility = ((high - low) / low) * 100;

            return {
                time: k[0], // Unix timestamp
                open,
                high,
                low,
                close,
                volume,
                change,
                // Using percentageVolatility as per common understanding of volatility in percentage
                volatility: percentageVolatility,
                // Store raw kline data if needed for more detailed calculations later
                _raw: k
            };
        });
    } catch (error) {
        console.error("Error fetching Binance historical data:", error);
        return [];
    }
}

// Function to setup WebSocket for real-time Order Book
let ws = null; // To hold the WebSocket instance globally or manage it carefully

export function setupBinanceOrderBookWebSocket(symbol, onMessageCallback) {
    // Close existing connection if any
    if (ws) {
        console.log(`Closing existing WebSocket for ${symbol}`);
        ws.close();
        ws = null;
    }

    // Binance WebSocket endpoint for depth stream (20 levels, 100ms update speed)
    // For more levels or faster updates, check Binance API documentation.
    // Replace .depth20@100ms with .depth@100ms for full depth or .depth@0ms for raw updates.
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`;
    console.log(`Attempting to connect to WebSocket: ${wsUrl}`);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log(`WebSocket connected for ${symbol}`);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Binance depth stream data format:
        // { "e": "depthUpdate", "E": 123456789, "s": "BNBUSDT", "U": 157, "u": 160,
        //   "b": [ ["0.0024", "10"] ], // Bids (price, quantity)
        //   "a": [ ["0.0025", "10"] ]  // Asks (price, quantity)
        // }
        if (data.e === 'depthUpdate') {
            onMessageCallback({
                symbol: data.s,
                bids: data.b.map(b => ({ price: parseFloat(b[0]), quantity: parseFloat(b[1]) })),
                asks: data.a.map(a => ({ price: parseFloat(a[0]), quantity: parseFloat(a[1]) }))
            });
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log(`WebSocket disconnected for ${symbol}`);
    };

    // Return a cleanup function to close the WebSocket when no longer needed
    return () => {
        if (ws) {
            console.log(`Cleaning up WebSocket for ${symbol}`);
            ws.close();
            ws = null;
        }
    };
}