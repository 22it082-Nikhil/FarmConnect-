const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversationId: {
        type: String,
        // Helper field to query unique conversations: `${minId}-${maxId}`
    },
    message: {
        type: String,
        required: true
    },
    offerContext: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for fast retrieval of chat history
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1 });

module.exports = mongoose.model('Message', messageSchema);
