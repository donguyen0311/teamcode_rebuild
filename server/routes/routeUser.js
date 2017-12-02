const express = require('express');
var router = express.Router();
const config = require('../config/default');
const User = require('../models/user');
const Project = require('../models/project');
const helper = require('../helper');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const multer = require('multer');
const path = require('path');

let upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, path.join(__dirname, '..', '..', 'client/assets/images'));
        },
        filename: (req, file, callback) => {
            //originalname is the uploaded file's name with extn
            callback(null, file.originalname);
        }
    })
});

// get all will be deleted soon, this is for testing purpose
// router.get('/', (req, res) => {
//     User.find({}, {
//         password: false,
//         salt: false
//     }, (err, users) => {
//         if (err) console.log(err);
//         if (!users) {
//             return res.json({
//                 success: false,
//                 message: 'Something wrong.'
//             });
//         }
//         return res.json({
//             success: true,
//             message: 'all users info',
//             users: users
//         });
//     });
// });

router.get('/company/:id', (req, res) => {
    User.find({
        current_company: req.params.id,
        belong_project: []
    })
    .populate('current_company')
    .exec((err, users) => {
        if (err) console.log(err);
        if (!users) {
            return res.json({
                success: false,
                message: 'Company ID not found.'
            });
        }
        return res.json({
            success: true,
            message: 'Your users info available in your company.',
            users: users
        });
    });
});

router.get('/', (req, res) => {
    User.findOne({
        _id: req.decoded.id
    }, {
        password: false,
        salt: false
    })
    .populate('current_company')
    .populate('belong_project')
    .exec((err, user) => {
        if (err) console.log(err);
        if (!user) {
            return res.json({
                success: false,
                message: 'Something wrong.'
            });
        }
        return res.json({
            success: true,
            message: 'users info',
            user: user
        });
    });
});

router.get('/:id', (req, res) => {
    User.findOne({
        _id: req.params.id
    }, {
        password: false,
        salt: false
    })
    .populate('current_company')
    .populate('belong_project')
    .exec((err, user) => {
        if (err) console.log(err);
        if (!user) {
            return res.json({
                success: false,
                message: 'ID not found.'
            });
        }
        return res.json({
            success: true,
            message: 'Your user info',
            user: user
        });
    });
});


// create with current company
router.post('/', (req, res) => {
    User.findOne({
        email: req.body.email
    }, (err, user) => {
        if (err) console.log(err);
        if (user) {
            return res.json({
                success: false,
                message: 'Email already exists.'
            });
        } else if (req.body.password !== req.body.confirm_password) {
            return res.json({
                success: false,
                message: 'Password doesn\'t match.'
            });
        } else {
            var password_sha512 = helper.sha512(req.body.password);
            var newUser = new User({
                email: req.body.email,
                username: req.body.username,
                password: password_sha512.password_encrypt,
                salt: password_sha512.salt,
                current_company: req.body.id_company,
                updatedAt: new Date()
            });
            newUser.save((err) => {
                if (err) console.log(err);
                return res.json({
                    success: true,
                    message: "Create user successful."
                });
            });
        }
    });
});

router.put('/:id', (req, res) => {
    User.findByIdAndUpdate(req.params.id, {
        $set: {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            description: req.body.description,
            experience: req.body.experience,
            study_at: req.body.study_at,
            work_at: req.body.work_at,
            time_available: req.body.time_available,
            language_programming: req.body.language_programming
        }
    }, {
        new: true, // return new user info
        fields: {
            password: false,
            salt: false
        }
    })
    .populate('current_company')
    .populate('belong_project')
    .exec((err, user) => {
        if (err) console.log(err);
        if (!user) {
            return res.json({
                success: false,
                message: 'Update user failed.'
            });
        }
        return res.json({
            success: true,
            message: 'Update user successful.',
            user: user
        });
    });
});

// this function not useful right now
router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id, (err, user) => {
        if (err) console.log(err);
        if (!user) {
            return res.json({
                success: false,
                message: 'Delete user failed.'
            });
        }
        return res.json({
            success: true,
            message: 'Delete user successful.'
        });
    });
});

router.get('/:email', (req, res) => {
    User.findOne({
        email: req.params.email
    }, {
        password: false,
        salt: false
    })
    .populate('current_company')
    .populate('belong_project')
    .exec((err, user) => {
        if (err) console.log(err);
        if (!user) {
            return res.json({
                success: false,
                message: 'Email not found.'
            });
        }
        return res.json({
            success: true,
            message: 'Your user info',
            user: user
        });
    });
});

router.put('/image', upload.any(), (req, res) => {
    res.status(200).json({
        code: 200,
        message: "Upload Sucess"
    });
});

module.exports = router;