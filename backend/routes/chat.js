const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Offer = require('../models/Offer');
const User = require('../models/User');

// GET /api/chats - Get all chats for the current user
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query; // Assuming userId is passed as query param for simplicity (or via auth middleware)

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const chats = await Chat.find({ participants: userId })
            .populate('offer')
            .populate('participants', 'name email')
            .sort({ updatedAt: -1 });

        // Populate crop details inside offer
        await Chat.populate(chats, {
            path: 'offer.crop',
            select: 'name price quantity'
        });

        res.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Server error fetching chats' });
    }
});

// POST /api/chats/create - Create or get existing chat for an offer
router.post('/create', async (req, res) => {
    try {
        const { offerId, currentUserId } = req.body;

        if (!offerId || !currentUserId) {
            return res.status(400).json({ message: 'Offer ID and User ID are required' });
        }

        // First, try to find an offer with this ID
        let offer = await Offer.findById(offerId);

        // If no offer found, it might be a service request ID
        // Try to find an offer by serviceRequest ID
        if (!offer) {
            offer = await Offer.findOne({ serviceRequest: offerId });
        }

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found for this request' });
        }

        // Check if chat already exists for this offer
        let chat = await Chat.findOne({ offer: offer._id });

        if (chat) {
            return res.json(chat);
        }

        // Determine participants based on offer type
        let participants = [];
        if (offer.offerType === 'service') {
            // Service offer: farmer and provider
            participants = [offer.farmer, offer.provider];
        } else {
            // Crop offer: farmer and buyer
            participants = [offer.farmer, offer.buyer || currentUserId];
        }

        // Create new chat
        chat = new Chat({
            offer: offer._id,
            participants: participants,
            lastMessage: 'Chat started'
        });

        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        console.error('Error creating chat:', error);
        console.error('Error details:', {
            offerId: req.body.offerId,
            currentUserId: req.body.currentUserId,
            errorMessage: error.message,
            errorStack: error.stack
        });
        res.status(500).json({ message: 'Server error creating chat', error: error.message });
    }
});

// GET /api/chats/:chatId/messages - Get messages for a chat
router.get('/:chatId/messages', async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .sort({ createdAt: 1 })
            .populate('sender', 'name');
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

// POST /api/chats/:chatId/messages - Send a message
router.post('/:chatId/messages', async (req, res) => {
    try {
        const { senderId, content } = req.body;
        const { chatId } = req.params;

        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const message = new Message({
            chat: chatId,
            sender: senderId,
            content
        });

        await message.save();

        // Update last message in Chat
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: content,
            updatedAt: Date.now()
        });

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
});

// Delete a chat
router.delete('/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;

        // Optional: Verify user permission (omitted for simplicity as roles are implicit)

        // Delete all messages associated with the chat
        await Message.deleteMany({ chat: chatId });

        // Delete the chat itself
        await Chat.findByIdAndDelete(chatId);

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
