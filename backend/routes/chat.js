const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Offer = require('../models/Offer');
const User = require('../models/User');

// Middleware to get user from clerkId (simplified for now, assuming frontend sends clerkId in headers or body effectively, 
// strictly speaking we should use the existing auth logic if available, but for now I'll lookup user by clerkId passed in headers)
// In previous tasks we might have established a pattern. Let's assume the frontend will send `x-clerk-user-id`.
const getUser = async (req, res, next) => {
    const clerkId = req.headers['x-clerk-user-id'];
    if (!clerkId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/chat/contacts - Get list of users to chat with (based on Bids/Offers)
router.get('/contacts', getUser, async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role.toLowerCase();
        console.log(`[Chat] Fetching contacts for User: ${userId}, Role: ${userRole}`);

        let contacts = [];
        let contactIds = new Set();

        // If Farmer: Find Buyers who have active offers with this farmer
        if (userRole === 'farmer') {
            const offers = await Offer.find({ farmer: userId }).populate('buyer', 'name email _id');
            console.log(`[Chat] Found ${offers.length} offers for farmer`);
            offers.forEach(offer => {
                if (offer.buyer && !contactIds.has(offer.buyer._id.toString())) {
                    contactIds.add(offer.buyer._id.toString());
                    contacts.push(offer.buyer);
                }
            });
        }
        // If Buyer: Find Farmers who have bid on my crops (Offers where buyer is me)
        else if (userRole === 'buyer') {
            const offers = await Offer.find({ buyer: userId }).populate('farmer', 'name email _id');
            console.log(`[Chat] Found ${offers.length} offers for buyer (ID: ${userId})`);
            offers.forEach(offer => {
                if (offer.farmer && !contactIds.has(offer.farmer._id.toString())) {
                    contactIds.add(offer.farmer._id.toString());
                    contacts.push(offer.farmer);
                }
            });
        }

        console.log(`[Chat] Found ${contacts.length} unique contacts`);

        // Add last message info for UI polish (optional but good)
        const contactsWithMeta = await Promise.all(contacts.map(async (contact) => {
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: userId, receiver: contact._id },
                    { sender: contact._id, receiver: userId }
                ]
            }).sort({ createdAt: -1 });

            // Count unread
            const unreadCount = await Message.countDocuments({
                sender: contact._id,
                receiver: userId,
                read: false
            });

            return {
                _id: contact._id,
                name: contact.name,
                email: contact.email,
                lastMessage: lastMsg ? lastMsg.content : null,
                lastMessageTime: lastMsg ? lastMsg.createdAt : null,
                unreadCount
            };
        }));

        res.json(contactsWithMeta);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/chat/messages/:contactId - Get conversation
router.get('/messages/:contactId', getUser, async (req, res) => {
    try {
        const userId = req.user._id;
        const contactId = req.params.contactId;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: contactId },
                { sender: contactId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });

        // Mark as read
        await Message.updateMany(
            { sender: contactId, receiver: userId, read: false },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/chat/messages - Send a message
router.post('/messages', getUser, async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });

        const savedMessage = await newMessage.save();
        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
