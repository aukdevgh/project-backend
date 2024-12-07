const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    jsonSettings: {
        type: Object,
        required: true,
    },
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
