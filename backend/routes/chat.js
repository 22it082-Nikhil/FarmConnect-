const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Offer = require('../models/Offer');
const User = require('../models/User');

// --- Helper Functions ---

// Get unique conversation ID between two users
const getConversationId = (user1, user2) => {
    return [user1, user2].sort().join('-');
};

// --- Routes ---

// @route   GET /api/chat/contacts
// @desc    Get list of users the current user can chat with (based on Offers)
// @access  Public (in this simplified version, realistically Protected)
router.get('/contacts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.query; // 'farmer' or 'buyer'

        if (!userId) return res.status(400).json({ error: 'User ID required' });

        let contactIds = [];

        if (role === 'farmer') {
            // Find offers where I am the farmer
            // We want to chat with the BUYER of those offers
            const offers = await Offer.find({ farmer: userId }).select('buyer');
            contactIds = offers.map(o => o.buyer?.toString()).filter(id => id); // Filter nulls
        } else if (role === 'buyer') {
            // Find offers where I am the buyer
            // We want to chat with the FARMER of those offers
            const offers = await Offer.find({ buyer: userId }).select('farmer');
            contactIds = offers.map(o => o.farmer?.toString()).filter(id => id);
        } else {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // De-duplicate IDs
        const uniqueContactIds = [...new Set(contactIds)];

        // Fetch User details for these contacts
        const contacts = await User.find({ _id: { $in: uniqueContactIds } })
            .select('name email role location phone'); // Select fields to display in sidebar

        res.json(contacts);
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/chat/history/:userId/:otherUserId
// @desc    Get chat history between two users
router.get('/history/:userId/:otherUserId', async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;

        // Find messages where (sender=me AND receiver=other) OR (sender=other AND receiver=me)
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        })
            .sort({ createdAt: 1 }); // Oldest first

        res.json(messages);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/chat/send
// @desc    Send a new message
router.post('/send', async (req, res) => {
    try {
        const { senderId, receiverId, message, offerId } = req.body;

        if (!senderId || !receiverId || !message) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const conversationId = getConversationId(senderId, receiverId);

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            conversationId,
            message,
            offerContext: offerId || null
        });

        await newMessage.save();

        res.json(newMessage);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
