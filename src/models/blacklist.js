const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    blacklistedAt: {
        type: Date,
        default: Date.now 
    },
    blacklistedUntil: {
        type: Date,
        required: true 
    },
    reason: {
        type: String,
        default: 'Exceeded rate limit threshold'
    }
});

const Blacklist = mongoose.model('Blacklist', blacklistSchema);

module.exports = Blacklist;