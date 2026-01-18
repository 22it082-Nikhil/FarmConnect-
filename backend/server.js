const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request Logger (Critical for Vercel Debugging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Database Connection Middleware (Ensures DB is connected for every request)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({ error: "Database connection failed" });
    }
});

// Health Check Route
app.get('/', (req, res) => {
    res.send('FarmConnect Backend is Running! (V2.0)');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/service-requests', require('./routes/serviceRequests'));
app.use('/api/rentals', require('./routes/rentals'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/provider-services', require('./routes/providerServices'));
app.use('/api/users', require('./routes/users'));

// Server listening logic for local dev vs Vercel
const PORT = process.env.PORT || 5001;
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
