const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true 
    },
    maxTokens: {
        type: Number,
        required: true,
        default: 20
    },

    refillRatePerMinute: {
        type: Number,
        required: true,
        default: 10
    },
    shortenUrlCost: {
        type: Number,
        required: true,
        default: 4 //set higher cost to generate short URL
    },
    standardRequestCost: {
        type: Number,
        required: true,
        default: 2
    },
    blacklistThreshold: {
        type: Number,
        default: 20, // If requested more than 20 times in a rate limited window of 10 minutes then blacklist
        required: true
    },
    blacklistDurationHours: {
        type: Number,
        default: 24, // set default black list duration to 24 hours
        required: true
    }
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;