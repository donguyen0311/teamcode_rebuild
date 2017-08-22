const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contributorSchema = new Schema({
    username: String,
    permission: String,
    status: String,
    time_join: Date
});

var taskSchema = new Schema({
    task_name: String,
    task_status: String,
    user_create: String,
    user_do: String,
    content: String,
    note: String
}, {
    timestamps: true
});

var projectSchema = new Schema({
    projectname: {
        type: String,
        required: true
    },
    contributors: [contributorSchema],
    tasks: [taskSchema]
});

module.exports = mongoose.model('Project', projectSchema);