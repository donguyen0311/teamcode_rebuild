const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const Company = require('./company');
const Project = require('./project');

var userSchema = new Schema({
    firstname: {
        type: String,
        required: false
    },
    lastname: {
        type: String,
        required: false
    },
    gender:{
        type: Boolean,
        default: 1
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
    belong_project: [{
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    }],
    description: {
        type: String,
        required: false
    },
    experience: {
        type: String,
        required: false
    },
    analyst_capability: {
        type: Number,
        required: true
    },
    programmer_capability: {
        type: Number,
        required: true
    },
    personnel_continuity: {
        type: Number,
        required: true
    },
    application_experience: {
        type: Number,
        required: true
    },
    platform_experience: {
        type: Number,
        required: true
    },
    language_and_toolset_experience: {
        type: Number,
        required: true
    },
    salary: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);