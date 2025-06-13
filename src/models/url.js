const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true,
        trim: true 
    },
    fullUrl: {
        type: String,
        required: true,
        trim: true 
    },
    createdAt: {
        type: Date,
        default: Date.now 
    }
});

const URL = mongoose.model('URL', urlSchema);

module.exports = URL;