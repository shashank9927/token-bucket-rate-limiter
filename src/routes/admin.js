const express = require('express');
const router = express.Router();
const RateLimit = require('../models/rateLimit');
const Settings = require('../models/settings');
const Blacklist = require('../models/blacklist');
const {requireAdmin} = require('../middleware/auth');
const {getOrCreateSettings} = require('../middleware/rateLimiter');

//apply admin authentication to all admin routes
router.use(requireAdmin);

// GET all users rate limit states
router.get('/rate-limits', async(req, res)=>{
    try {
        const rateLimits = await RateLimit.find();

        // get global settings for context
        const settings = await getOrCreateSettings();

        res.json({
            settings: {
                maxTokens: settings.maxTokens,
                refillRatePerMinute: settings.refillRatePerMinute,
                standardRequestCost: settings.standardRequestCost,
                shortenUrlCost: settings.shortenUrlCost,
                blacklistThreshold: settings.blacklistThreshold,
                blacklistDurationHours: settings.blacklistDurationHours
            },
            userRateLimits: rateLimits
        });
    }
    catch(err) {
        console.error('Error getting rate limits: ', err);
        res.status(500).json({
            error: 'Failed to retrieve rate limits'
        });
    }
});

//update global rate limit settings
router.put('/rate-limits', async (req,res) =>{
    try {
        const {maxTokens, refillRatePerMinute, standardRequestCost, shortenUrlCost, blacklistThreshold, blacklistDurationHours} = req.body;

        //validate input
        if(!maxTokens && !refillRatePerMinute && !standardRequestCost && !shortenUrlCost && !blacklistThreshold && !blacklistDurationHours) {
            return res.status(400).json({
                error: 'At least one setting must be provided'
            });
        }

        // get current settings
        const settings = await getOrCreateSettings();

        //update only the provided fields
        if(maxTokens !== undefined) {
            if(maxTokens <= 0) {
                return res.status(400).json({
                    error: 'maxTokens must be positive'
                });
            }
            settings.maxTokens = maxTokens;
        }

        if(refillRatePerMinute !== undefined) {
            if(refillRatePerMinute <= 0){
                return res.status(400).json({
                    error: 'refillRatePerMinute must be positive'
                });
            }
            settings.refillRatePerMinute = refillRatePerMinute;
        }

        if(standardRequestCost !== undefined) {
            if(standardRequestCost <=0) {
                return res.status(400).json({
                    error: 'standardRequestCost must be positive'
                });
            }
            settings.standardRequestCost = standardRequestCost;
        }

        if(shortenUrlCost !== undefined) {
            if(shortenUrlCost <=0){
                return res.status(400).json({
                    error: 'shortenUrlCost must be positive'
                });
            }
            settings.shortenUrlCost = shortenUrlCost;
        }

        //update blacklist settings
        if(blacklistThreshold !== undefined) {
            if(blacklistThreshold <= 0) {
                return res.status(400).json({
                    error: 'blacklistThreshold must be positive'
                });
            }

            settings.blacklistThreshold = blacklistThreshold;
        }

        if(blacklistDurationHours !== undefined) {
            if(blacklistDurationHours <= 0){
                return res.status(400).json({
                    error: 'blacklistDurationHours must be positive'
                });
            }
            settings.blacklistDurationHours = blacklistDurationHours;
        }
        await settings.save();

        res.json({
            message: 'Rate limit settings updated successfully',
            settings
        });
    }
    catch(err) {
        console.error('Error updating rate limit settings: ', err);
        res.status(500).json({
            error: 'Failed to update rate limit settings'
        });
    }
});

// Get all blacklisted users
router.get('/blacklist', async(req,res) =>{
    try{
        //get all blacklisted entries
        const blacklistEntries = await Blacklist.find().sort({blacklistedAt: -1});

        res.json({
            blacklistEntries
        });
    }
    catch(err) {
        console.error('Error getting blacklist: ', err);
        res.status(500).json({
            error: 'Failed to retrieve blacklist'
        });
    }
});

// remove a user from blacklist
router.delete('/blacklist/:userId', async(req,res)=>{
    try {
        const {userId} = req.params;

        // find and remove the blacklist entry
        const result = await Blacklist.deleteOne({
            userId,
            blacklistedUntil: {$gt: new Date()} // only remove active blacklist
        });

        if(result.deletedCount === 0) {
            return res.status(404).json({
                error: 'No active blacklist found for this user'
            });
        }

        res.json({
            message: 'User removed from blacklist successfully',
            userId
        });
    }
    catch(err) {
        console.error('Error removing user from blacklist: ', err);
        res.status(500).json({
            error: 'Failed to remove user from blacklist'
        });
    }
});

module.exports = router;

