const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const Company = require('./company');

var userSchema = new Schema({
    firstname: {
        type: String,
        required: false
    },
    lastname: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    language_programming: {
        type: [String],
        required: false
    },
    image: {
        type: String,
        default: '/assets/images/no_image.png'
    },
    docker: {
        type: [{
            dockername: String,
            hostname: String,
            portSSH: Number
        }]
    },
    level: {
        type: String,
        required: false
    },
    time_available: {
        type: String,
        required: false
    },
    studied_at: {
        type: [String],
        required: false
    },
    worked_at: {
        type: [String],
        required: false
    },
    current_company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: false
    },
    description: {
        type: String,
        required: false
    },
    experience: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);