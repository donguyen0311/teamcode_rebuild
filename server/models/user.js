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
    status: {
        type: Number,
        required: false
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
    // time_available: {
    //     type: String,
    //     required: false
    // },
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
        required: false
    },
    programmer_capability: {
        type: Number,
        required: false
    },
    personnel_continuity: {
        type: Number,
        required: false
    },
    application_experience: {
        type: Number,
        required: false
    },
    platform_experience: {
        type: Number,
        required: false
    },
    language_and_toolset_experience: {
        type: Number,
        required: false
    },
    salary: {
        type: Number,
        required: false
    },
    work_time:{
        office: {
            type: Number,
            require: false
        },
        overtime: {
            type: Number,
            require: false
        },
        projects:[{
            _id:false,
            project: {
                type: Schema.Types.ObjectId, 
                ref: 'Project',
                required: false
            },          
            office: {
                type: Number,
                require: false
            },
            overtime: {
                type: Number,
                require: false
            },
        }]
    }
}, {
    timestamps: true,
    collection: 'upgraded_users_max_2_projects'
});

module.exports = mongoose.model('User', userSchema);