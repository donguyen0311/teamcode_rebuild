const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const User = require('./user');

var companySchema = new Schema({
    company_name: {
        type: String,
        required: true
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    field: {
        type: String,
        required: false
    },
    image: {
        type: String,
        default: "/assets/images/no_image.jpg"
    },
    staff: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Company', companySchema);