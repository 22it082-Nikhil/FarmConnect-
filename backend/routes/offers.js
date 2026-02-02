const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');

const Crop = require('../models/Crop');
const BuyerNeed = require('../models/BuyerNeed');
const Notification = require('../models/Notification');

// Get all offers for a farmer
// Get all offers (filtered by farmer, provider, or buyer)
router.get('/', async (req, res) => {
    try {
        // console.log("GET /api/offers query:", req.query);
        const { farmerId, providerId, buyerId, buyerNeed, serviceBroadcast, status } = req.query;

        let query = {};
        if (farmerId && farmerId !== 'dummy') query.farmer = farmerId;
        if (providerId) {
            query.provider = providerId;
        }
        if (buyerId) query.buyer = buyerId;
        if (buyerNeed) query.buyerNeed = buyerNeed;
        if (serviceBroadcast) query.serviceBroadcast = serviceBroadcast;
        if (status) query.status = status;

        console.log("Constructed Query:", query);

        // Populate crop details and service request details
        const offers = await Offer.find(query)
            .populate('crop')
            .populate('serviceRequest')
            .populate({
                path: 'buyerNeed',
                populate: { path: 'buyer', select: 'name email phone' }
            }) // Populate requirement details with nested buyer
            .populate('farmer', 'name email phone location latitude longitude') // Populate farmer details with location and coordinates
            .populate('provider', 'name email phone') // Populate provider details
            .populate('buyer', 'name email phone') // Populate buyer details
            .sort({ createdAt: -1 });

        // console.log(`Found ${offers.length} offers for query:`, query);
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new offer
router.post('/', async (req, res) => {
    try {
        const { farmer, provider, buyer, crop, buyerNeed, serviceBroadcast, serviceRequest, offerType, buyerName, providerName, pricePerUnit, quantityRequested, bidAmount, message } = req.body;

        const newOffer = new Offer({
            farmer,
            provider, // Save Provider ID
            buyer,    // Save Buyer ID
            crop: crop || undefined,
            buyerNeed: buyerNeed || undefined,
            serviceBroadcast: serviceBroadcast || undefined, // Save Service Broadcast ID
            serviceRequest: serviceRequest || undefined,
            offerType: offerType || 'crop',
            buyerName: buyerName || 'Local Buyer',
            providerName: providerName || 'Service Provider',
            pricePerUnit,
            quantityRequested,
            bidAmount,
            message
        });

        const savedOffer = await newOffer.save();

        // Populate based on offer type
        let populatedOffer;
        if (savedOffer.offerType === 'service') {
            populatedOffer = await Offer.findById(savedOffer._id).populate('serviceRequest');
        } else {
            populatedOffer = await Offer.findById(savedOffer._id).populate('crop');
        }

        res.status(201).json(populatedOffer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update offer status (Accept/Reject)
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const offer = await Offer.findById(req.params.id);

        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        offer.status = status;
        const updatedOffer = await offer.save();

        // Smart Integration: If accepted, deduct quantity from crop
        if (status === 'accepted' && offer.crop) {
            const crop = await Crop.findById(offer.crop);
            // Smart Integration: If accepted, deduct quantity from crop
            console.log(`[Offer Accept] Processing offer ${offer._id} for crop ${offer.crop}`);
            console.log(`[Offer Accept] Raw Crop Quantity: "${crop.quantity}"`); // Debug log

            // Safe parsing: Convert to string, match number
            const qtyStr = String(crop.quantity);
            const qtyMatch = qtyStr.match(/(\d+(\.\d+)?)/);
            const currentQty = qtyMatch ? parseFloat(qtyMatch[0]) : 0;

            const requestedQty = parseFloat(offer.quantityRequested) || 0;

            console.log(`[Offer Accept] Current: ${currentQty}, Requested: ${requestedQty}`);

            if (requestedQty > 0) {
                let newQty = currentQty - requestedQty;
                let newStatus = crop.status;

                if (newQty <= 0) {
                    newQty = 0;
                    newStatus = 'sold';
                    console.log(`[Offer Accept] Crop sold out!`);
                }

                // Preserve unit if possible
                const unitMatch = qtyStr.match(/[a-zA-Z]+/);
                const unit = unitMatch ? unitMatch[0] : 'kg';

                // Update crop
                crop.quantity = `${newQty} ${unit}`;
                crop.status = newStatus;

                await crop.save();
                console.log(`[Inventory] Updated Crop: ${crop.quantity}, Status: ${crop.status}`);
            } else {
                console.warn(`[Offer Accept] Invalid requested quantity: ${requestedQty}`);
            }
        }

        // Trigger Notification for Bid Acceptance
        if (status === 'accepted') {
            // Handle Buyer Need Fulfillment
            if (offer.offerType === 'need_fulfillment' && offer.buyerNeed) {
                const buyerNeed = await BuyerNeed.findById(offer.buyerNeed);
                if (buyerNeed) {
                    // Update Buyer Need status to fulfilled
                    // In a more complex system, we might check quantities (partial fulfillment), 
                    // but here we assume full fulfillment for simplicity as per user request ("changed to completed")
                    buyerNeed.status = 'fulfilled';
                    await buyerNeed.save();
                }
            }

            if (offer.provider) {
                await Notification.create({
                    recipient: offer.provider,
                    type: 'bid_accepted',
                    message: `Your bid for ${offer.offerType === 'service' ? 'Service' : 'Crop'} has been accepted!`,
                    relatedId: offer._id
                });
            } else if (offer.farmer) {
                // Notify Farmer for Buyer Need Acceptance
                await Notification.create({
                    recipient: offer.farmer,
                    type: 'bid_accepted',
                    message: `Your bid for Buyer Requirement has been accepted!`,
                    relatedId: offer._id
                });
            }
        }

        res.json(updatedOffer);
    } catch (err) {
        console.error("Error updating offer:", err);
        res.status(400).json({ message: err.message });
    }
});
// Delete an offer
router.delete('/:id', async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a tracking update to an order
router.post('/:id/tracking', async (req, res) => {
    try {
        const { status, location, note } = req.body;
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Add to history
        offer.trackingUpdates.push({
            status,
            location,
            note,
            timestamp: new Date()
        });

        // Update main status if it maps to a main status
        if (['accepted', 'shipped', 'delivered'].includes(status)) {
            offer.status = status;
        }

        await offer.save();
        res.json(offer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
