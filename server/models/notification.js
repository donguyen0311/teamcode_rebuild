const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const User = require('./user');

var notificationSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        required: true
    },
    belong_user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    link: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);