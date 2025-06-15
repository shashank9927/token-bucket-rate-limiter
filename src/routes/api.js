const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const UrlModel = require('../models/url');
const RateLimit = require('../models/rateLimit');
const {requireUser} = require('../middleware/auth');
const {rateLimiter} = require('../middleware/rateLimiter');

// Apply rate limiter middleware to all API routes
router.use(requireUser, rateLimiter);

// create a short URL
router.post('/shorten', async(req, res) => {
    try {
        const {url} = req.body;

        if(!url) {
            return res.status(400).json({
                error: 'URL is required'
            });
        }

        // Validate URL format
        try{
            new URL(url); 
        }
        catch(err) {
            return res.status(400).json({
                error: 'Invalid URL format'
            });
        }

        // Generate a unique short code
        const shortCode = generateShortCode();

        // create new URL record
        const newUrl = new UrlModel({
            shortCode,
            fullUrl: url,
            createdAt: Date.now()
        });

        await newUrl.save();

        res.status(201).json({
            shortCode,
            fullUrl: url,
            shortUrl: `${req.protocol}://${req.get('host')}/api/visit/${shortCode}`
        });
    }
    catch(err) {
        console.error(`Error shortening URL: `,err);
        res.status(500).json({
            error: 'Failed to create short URL'
        });
    }
});

// Expand a short URL
router.get('/expand/:shortCode', async (req,res) => {
    try{
        const {shortCode} = req.params;
        const url = await UrlModel.findOne({shortCode});

        if(!url) {
            return res.status(404).json({
                error: 'Short URL not found'
            });
        }

        res.json({
            shortCode: url.shortCode,
            fullUrl: url.fullUrl
        });
    }
    catch(err) {
        console.error('Error expanding URL: ', err);
        res.status(500).json({
            error: 'Failed to expand URL'
        });
    }
});

// Visit a short URL
router.get('/visit/:shortCode', async(req,res) =>{
    try{
        const {shortCode} = req.params;
        const url = await UrlModel.findOne({shortCode});

        if(!url) {
            return res.status(404).json({
                error: 'Short URL not found'
            });
        }

        // Redirect to full URL
        res.redirect(url.fullUrl);
    }
    catch(err) {
        console.error('Error visting URL: ', err);
        res.status(500).json({
            error: 'Failed to process URL visit'
        });
    }
});

// Get user rate limit status

router.get('/rate-limit/status', async(req,res)=>{
    try {
        const userId = req.user.id;

        let rateLimit = await RateLimit.findOne({userId});

        if(!rateLimit) {
            return res.status(404).json({
                error: 'Rate limit information not found'
            });
        }

        // calculate next reset time based on refill rate
        const {getOrCreateSettings} = require('../middleware/rateLimiter');

        const settings = await getOrCreateSettings();

        // Update token count based on elapsed time
        const now = Date.now();

        const timeSinceLastRefill = (now - rateLimit.lastRefill) / 1000 / 60; // in minutes

        // calculate tokens to add based on refill rate
        const tokensToAdd = Math.floor(timeSinceLastRefill * settings.refillRatePerMinute);

        // check if rate limited attempts should be reset (older than 10 minutes)
        const tenMinutesAgo = new Date(now - 60 * 10 * 1000);
        if(!rateLimit.rateLimitedAttemptsResetTime || rateLimit.rateLimitedAttemptsResetTime < tenMinutesAgo) {
            //reset the counter if the window has passed
            if(rateLimit.rateLimitedAttempts > 0) {
                rateLimit.rateLimitedAttempts = 0;
                rateLimit.rateLimitedAttemptsResetTime = null;
            }
        }

        // Refill tokens if needed
        if(tokensToAdd > 0) {
            rateLimit.tokens = Math.min(
                rateLimit.tokens + tokensToAdd,
                settings.maxTokens
            );
            rateLimit.lastRefill = now;
        }

        // save changes to ensure the state is persistent
        await rateLimit.save();

        const tokensRemaining = rateLimit.tokens;

        // calculate seconds until tokens are refilled to max
        const resetSeconds = Math.ceil((settings.maxTokens - tokensRemaining) / settings.refillRatePerMinute * 60);

        // calculate when the attempts counter resets (if active) and the minutes remaining
        let attemptsResetTime = null;
        let attemptsResetMinutes = null;

        if(rateLimit.rateLimitedAttemptsResetTime) {
            attemptsResetTime = new Date(rateLimit.rateLimitedAttemptsResetTime.getTime() + 10 * 60 * 1000);
            
            attemptsResetMinutes = Math.ceil((attemptsResetTime - now)/(60 * 1000));
        }

        res.json({
            userId,
            tokensRemaining,
            maxTokens: settings.maxTokens,
            refillRatePerMinute: settings.refillRatePerMinute,
            requestCosts: {
                standard: settings.standardRequestCost,
                shortenUrl: settings.shortenUrlCost
            },
            blacklistStatus: {
                rateLimitedAttempts: rateLimit.rateLimitedAttempts || 0,
                threshold: settings.blacklistThreshold,
                windowMinutes: 10,
                attemptsResetMinutes: attemptsResetMinutes,
                active: rateLimit.rateLimitedAttempts > 0,
                warningMessage: rateLimit.rateLimitedAttempts > 0 ? 
                                        `Warning: You have made ${rateLimit.rateLimitedAttempts} of ${settings.blacklistThreshold} allowed attempts while rate limited. This counter resets in ${attemptsResetMinutes} minutes` : null
            },
            resetSeconds
        });

    }

    catch(err) {
        console.error('Error getting rate limit status: ', err);
        res.status(500).json({
            error: 'Failed to get rate limit status'
        });
    }
});

// helper function to generate random short code
function generateShortCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '' ;

    for(let i = 0; i<length; i++) {
        const randomIndex = crypto.randomInt(0,characters.length);
        shortCode += characters.charAt(randomIndex);
    }
    return shortCode;
}

module.exports = router;