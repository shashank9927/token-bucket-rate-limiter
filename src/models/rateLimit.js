const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true 
    },
    tokens: {
        type: Number,
        required: true,
        default: 20 //will be overwritten by global settings
    },
    lastRefill: {
        type: Date,
        required: true,
        default: Date.now,
    },

    rateLimitedAttempts: { // track attempts when rate limited
        type: Number,
        default: 0
    },
    rateLimitedAttemptsResetTime: {
        type: Date,
        default: null
    }

});

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

module.exports = RateLimit;