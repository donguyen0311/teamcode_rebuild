const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username: String,
    email: String,
    password: String,
    admin: Boolean
});

module.exports = mongoose.model('User', userSchema);