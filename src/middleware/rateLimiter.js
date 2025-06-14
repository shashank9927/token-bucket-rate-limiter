const RateLimit = require('../models/rateLimit');
const Settings = require('../models/settings');
const Blacklist = require('../models/blacklist');

//middleware to implement token bucket rate limiter
const rateLimiter = async (req, res, next) => {
    try {
        // Only apply rate limit to authenticated users with 'user' role
        if(!req.user || req.user.role !== 'user') {
            return next();
        }

        const userId = req.user.id;

        // check if the user is blacklisted
        const blacklistedUser = await Blacklist.findOne({
            userId,
            blacklistedUntil: {$gt: new Date()}
        });

        if(blacklistedUser) {
            const remainingTime = Math.ceil((blacklistedUser.blacklistedUntil - Date.now()) / (1000 * 60 * 60)); // in hours
            return res.status(403).json({
                error: 'User is blacklisted',
                reason: blacklistedUser.reason,
                blacklistedUntil: blacklistedUser.blacklistedUntil,
                hoursRemaining: remainingTime
            });
        }

        // Get global settings
        const settings = await getOrCreateSettings();

        
        //Determine the cost of the current request
        let requestCost = settings.standardRequestCost;

        if(req.path === '/shorten' && req.method === 'POST') {
            requestCost = settings.shortenUrlCost;
        }

        // Get or create user's rate limit bucket
        let userRateLimit = await RateLimit.findOne({userId});

        if(!userRateLimit) {
            userRateLimit = new RateLimit({
                userId,
                tokens: settings.maxTokens,
                lastRefill: Date.now()
            });
        }

        //calculate time since last refill
        const now = Date.now();
        const timeSinceLastRefill = (now - userRateLimit.lastRefill) / 1000 / 60; // in minutes

        //calculate tokens to add based on refill rate
        let tokensToAdd = Math.floor(timeSinceLastRefill * settings.refillRatePerMinute);

        // Refill tokens if needed
        if(tokensToAdd > 0) {
            userRateLimit.tokens = Math.min(userRateLimit.tokens + tokensToAdd, settings.maxTokens);
            
            userRateLimit.lastRefill = now;

        }

        // check if user has enough tokens to make this request
        if(userRateLimit.tokens < requestCost) {
            // track attempts made while rate-limited using a 10 minute window
            const tenMinutesAgo = new Date(now - 10 * 60 * 1000);

            //initialize or reset the window if needed
            if(!userRateLimit.rateLimitedAttemptsResetTime || userRateLimit.rateLimitedAttemptsResetTime < tenMinutesAgo) {
                userRateLimit.rateLimitedAttempts = 1;
                userRateLimit.rateLimitedAttemptsResetTime = now;
            }
            else {
                // Increment attempts within the current window
                userRateLimit.rateLimitedAttempts++;
            }

            //check if user should be blacklisted based on attempts in the 10 minute window
            if(userRateLimit.rateLimitedAttempts >= settings.blacklistThreshold) {
                //create blacklist entry
                const blacklistDuration = settings.blacklistDurationHours || 24; //default is 24 hours
                const blacklistedUntil = new Date(now + blacklistDuration * 60 * 60 * 1000);

                await Blacklist.create({
                    userId,
                    blacklistedAt: now,
                    blacklistedUntil,
                    reason: `Exceeded rate limit threshold of ${settings.blacklistThreshold} attempts in 10 minutes`
                });

                // Reset the counter
                userRateLimit.rateLimitedAttempts = 0;
                await userRateLimit.save();

                return res.status(403).json({
                    error: 'Account blacklisted',
                    reason: `Exceeded ${settings.blacklistThreshold} attempts in 10 minutes while rate limited`,
                    blacklistedUntil,
                    hoursRemaining: blacklistDuration
                });
            }

            // calculate seconds until next token
            const secondsToNextToken = Math.ceil((1/settings.refillRatePerMinute) * 60);

            //calculate when the rate limited attempts counter will reset (in minutes)
            const attemptsResetTime = new Date(userRateLimit.rateLimitedAttemptsResetTime.getTime() + 10 * 60 * 1000);
            const attemptsResetMinutes = Math.ceil((attemptsResetTime - now) / (60 * 1000));

            //save the current state before returning error
            await userRateLimit.save();

            return res.status(429).json({
                error: 'Rate limit exceeded',
                tokensRemaining: userRateLimit.tokens,
                resetSeconds: secondsToNextToken,
                rateLimitedAttempts: userRateLimit.rateLimitedAttempts,
                attemptsResetMinutes: attemptsResetMinutes,
                warningMessage: `Warning: You have made ${userRateLimit.rateLimitedAttempts} of ${settings.blacklistThreshold} allowed attempts while rate limited. This counter resets in ${attemptsResetMinutes} minutes`
            });


        }

        // consume tokens for the request
        userRateLimit.tokens -= requestCost;

        // No need to rate limit for successful request
        // The 10 minute window will handle this automatically

        // save updated rate limit
        await userRateLimit.save();

        // Add rate limit info to response headers
        res.set({
            'X-RateLimit-Limit': settings.maxTokens,
            'X-RateLimit-Remaining': userRateLimit.tokens,
            'X-RateLimit-Reset': Math.ceil(now/1000) + (60/settings.refillRatePerMinute)
        });

        next();
    }

    catch(err) {
        console.error('Rate limiting error: ',err);
        next(err);
    }
};

// Helper function to get or create global settings
const getOrCreateSettings = async () => {
    let settings = await Settings.findOne({
        key: 'global',
    });

    if(!settings) {
        settings = await Settings.create({
            key: 'global',
            maxTokens: 20,
            refillRatePerMinute: 10,
            shortenUrlCost: 4,
            standardRequestCost: 2,
            blacklistThreshold: 20,
            blacklistDurationHours: 24
        });
    }
    return settings;
};

module.exports = {
    rateLimiter,
    getOrCreateSettings
};

