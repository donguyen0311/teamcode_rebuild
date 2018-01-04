const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const User = require('./user');
const Project = require('./project');

var chatSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    to: {
        type: Schema.Types.ObjectId, 
        required: true
    },
    message: { 
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);