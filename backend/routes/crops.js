

const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/crops');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'crop-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// @route   POST api/crops/upload-image
// @desc    Upload crop image
// @access  Public
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return the file path relative to the server
        const imageUrl = `/uploads/crops/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (err) {
        console.error('Image upload error:', err.message);
        res.status(500).json({ message: 'Error uploading image', error: err.message });
    }
});

// @route   GET api/crops
// @desc    Get all crops (optionally filtered by farmer)
// @access  Public
router.get('/', async (req, res) => {
    const { farmerId } = req.query;
    try {
        let query = {};
        if (farmerId) {
            query.farmer = farmerId;
        }
        const crops = await Crop.find(query)
            .populate('farmer', 'name')
            .sort({ createdAt: -1 });
        res.json(crops);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/crops
// @desc    Add a new crop
// @access  Public
router.post('/', async (req, res) => {
    const { farmer, name, quantity, price, image } = req.body;
    try {
        const newCrop = new Crop({
            farmer,
            name,
            quantity,
            price,
            image
        });
        const crop = await newCrop.save();
        res.json(crop);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/crops/:id
// @desc    Update a crop
// @access  Public
router.put('/:id', async (req, res) => {
    const { name, quantity, price, status, image } = req.body;
    try {
        let crop = await Crop.findById(req.params.id);
        if (!crop) return res.status(404).json({ msg: 'Crop not found' });

        crop.name = name || crop.name;
        crop.quantity = quantity || crop.quantity;
        crop.price = price || crop.price;
        crop.status = status || crop.status;
        if (image !== undefined) crop.image = image;

        await crop.save();
        res.json(crop);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/crops/:id
// @desc    Delete a crop
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        let crop = await Crop.findById(req.params.id);
        if (!crop) return res.status(404).json({ msg: 'Crop not found' });

        await Crop.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Crop removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
