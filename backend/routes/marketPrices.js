const express = require('express');
const router = express.Router();

// Mock data generator for Mandi Prices
// In a real production app, this would fetch from data.gov.in API
const generateMarketData = () => {
    const markets = ['Azadpur Mandi (Delhi)', 'Vashi Mandi (Mumbai)', 'APMC (Ahmedabad)', 'Nagpur Mandi', 'Khanna Mandi (Punjab)'];
    const crops = [
        { name: 'Wheat', base: 2200, unit: 'Qtl' },
        { name: 'Rice (Basmati)', base: 4500, unit: 'Qtl' },
        { name: 'Cotton', base: 6000, unit: 'Qtl' },
        { name: 'Maize', base: 1800, unit: 'Qtl' },
        { name: 'Potato', base: 1200, unit: 'Qtl' },
        { name: 'Onion', base: 2500, unit: 'Qtl' },
        { name: 'Soybean', base: 3800, unit: 'Qtl' }
    ];

    let data = [];

    // Generate some random market data
    markets.forEach(market => {
        // Pick 3-5 random crops for each market
        const marketCrops = crops.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));

        marketCrops.forEach(crop => {
            // Randomize price slightly around base
            const price = Math.floor(crop.base + (Math.random() * 400) - 200);
            // Random change percentage
            const change = (Math.random() * 10 - 5).toFixed(2);

            data.push({
                _id: Math.random().toString(36).substr(2, 9),
                market,
                crop: crop.name,
                price,
                unit: crop.unit,
                change: parseFloat(change),
                date: new Date().toISOString()
            });
        });
    });

    return data;
};

// @route   GET api/market-prices
// @desc    Get current market prices
// @access  Public
router.get('/', (req, res) => {
    try {
        const data = generateMarketData();
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
