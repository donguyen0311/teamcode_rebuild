const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const User = require('./user');
const Project = require('./project');

var activitySchema = new Schema({
    action: {
        type: String,
        required: true
    },
    belong_project: {
        type: Schema.Types.ObjectId, 
        ref: 'Project',
        required: true
    },
    belong_user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);