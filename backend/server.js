
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
// Middleware
app.use(cors({
    origin: '*', // Allow all origins for now to fix connection issues
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
    res.send('FarmConnect Backend is Running!');
});

// Database Connection
// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmconnect';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const cropRoutes = require('./routes/crops');
const serviceRequestRoutes = require('./routes/serviceRequests');
const rentalRoutes = require('./routes/rentals');
const offerRoutes = require('./routes/offers');
const providerServiceRoutes = require('./routes/providerServices');

app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/provider-services', providerServiceRoutes);
app.use('/api/users', require('./routes/users'));

// Server listening logic for local dev vs Vercel
const PORT = process.env.PORT || 5001;
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
