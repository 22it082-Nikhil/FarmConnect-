
const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Vehicle', 'Manpower', 'Equipment', 'Storage', 'Processing'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    duration: {
        type: String, // e.g., "2 days", "1 week"
        required: true
    },
    budget: {
        type: String, // e.g., "₹5000"
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
