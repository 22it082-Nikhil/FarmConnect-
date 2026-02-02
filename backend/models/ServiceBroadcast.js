const mongoose = require('mongoose');

const ServiceBroadcastSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Type of service (borrowed from existing ServiceRequest types or extended)
    type: {
        type: String,
        enum: ['Vehicle', 'Manpower', 'Equipment', 'Storage', 'Processing', 'Other'],
        required: true
    },
    title: {
        type: String,
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
    budget: {
        type: Number, // The price at which they are Offering the service
        required: true
    },
    availabilityDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: false // Optional end date of availability
    },
    duration: {
        type: String, // e.g. "2 days", "1 week"
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'filled', 'expired', 'cancelled'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ServiceBroadcast', ServiceBroadcastSchema);
