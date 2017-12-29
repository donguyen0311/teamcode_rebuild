const express = require('express');
var router = express.Router();
const config = require('../config/default');
const User = require('../models/user');
const Project = require('../models/project');
const Company = require('../models/company');
const helper = require('../helper');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const multer = require('multer');
const path = require('path');
const _ = require('lodash');
const sendMail = require('../mailer/mailer');

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
// router.get('/company/:id', (req, res) => {
//     User.find({
//         current_company: req.params.id
//     }, {
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

router.get('/waiting/company/:id', (req, res) => {
    User.find({
        current_company: req.params.id,
        status: 0
    },{
        password: false,
        salt: false
    }, (err, users) => {
        if (err) console.log(err);
        if (!users) {
            return res.json({
                success: false,
                message: 'Something wrong.'
            });
        }
        return res.json({
            success: true,
            message: 'all users info',
            users: users
        });
    });
});

router.get('/all/company/:id', (req, res) => {
    User.find({
        current_company: req.params.id,
        status: 1
    },{
        password: false,
        salt: false
    }, (err, users) => {
        if (err) console.log(err);
        if (!users) {
            return res.json({
                success: false,
                message: 'Something wrong.'
            });
        }
        return res.json({
            success: true,
            message: 'all users info',
            users: users
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
                firstname: 'Anonymous',
                lastname: 'TC',
                email: req.body.email,
                username: req.body.username,
                password: password_sha512.password_encrypt,
                salt: password_sha512.salt,
                current_company: req.body.id_company,
                admin: 0,
                status: 0
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

router.post('/company/:id', (req, res) => {
    User.findOne({
        email: req.body.email,
        current_company: req.params.id
    }, async (err, user) => {
        if (err) console.log(err);
        if (user) {
            return res.json({
                success: false,
                message: 'Email already exists.'
            });
        }
        var randomPassword = helper.genRandomString(20) + helper.genRandomSpecialString(1);
        var password_sha512 = helper.sha512(randomPassword);
        var username = _.slice(req.body.email, 0, _.indexOf(req.body.email, '@')).join('');
        var newUser = new User({
            firstname: 'Anonymous',
            lastname: 'TC',
            email: req.body.email,
            username: username,
            password: password_sha512.password_encrypt,
            salt: password_sha512.salt,
            current_company: req.params.id,
            status: 0,
            analyst_capability: 0,
            programmer_capability: 0,
            application_experience: 0,
            platform_experience: 0,
            language_and_toolset_experience: 0,
            admin: 0
        });
        var company = await Company.findById(req.params.id);
        newUser.save((err) => {
            if (err) console.log(err);
            let mail_content = `
                <h4>This is your account information:</h4> 
                <p>Email: ${req.body.email}</p> 
                <p>Username: ${username}</p>
                <p>Password: ${randomPassword}</p>
                <p>Company Name: ${company.company_name}</p>
            `;
            sendMail(req.body.email, mail_content);
            return res.json({
                success: true,
                message: "Create user successful."
            });
        });
    });
});

router.put('/:id', (req, res) => {
    if(req.query.change_password) {
        User
            .findById(req.params.id)
            .exec((err, user) => {
                if (err) console.log(err);
                if (!user) {
                    return res.json({
                        success: false,
                        message: 'User not found.'
                    });
                }
                if (!helper.compareSync(req.body.old_password, user.salt, user.password)) {
                    return res.json({
                        success: false,
                        message: 'Update failed. Wrong Old Password.'
                    });
                }
                if (req.body.new_password !== req.body.confirm_password) {
                    return res.json({
                        success: false,
                        message: 'Update failed. Confirm Password Not Match.'
                    });
                }
                var password_sha512 = helper.sha512(req.body.new_password);
                User.findByIdAndUpdate(user._id, {
                    $set: {
                        password: password_sha512.password_encrypt,
                        salt: password_sha512.salt
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
    } else {
        User.findByIdAndUpdate(req.params.id, {
            $set: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                studied_at: req.body.studied_at,
                worked_at: req.body.worked_at,
                gender: req.body.gender,
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
    }
});

router.put('/:id/skill', (req, res) => {
    User.findByIdAndUpdate(req.params.id, {
            $set: {
                analyst_capability: req.body.analyst_capability,
                programmer_capability: req.body.programmer_capability,
                application_experience: req.body.application_experience,
                platform_experience: req.body.platform_experience,
                language_and_toolset_experience: req.body.language_and_toolset_experience,
                salary: req.body.salary,
                admin: req.body.admin
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
// router.delete('/:id', (req, res) => {
//     User.findByIdAndRemove(req.params.id, (err, user) => {
//         if (err) console.log(err);
//         if (!user) {
//             return res.json({
//                 success: false,
//                 message: 'Delete user failed.'
//             });
//         }
//         return res.json({
//             success: true,
//             message: 'Delete user successful.'
//         });
//     });
// });

router.delete('/:id', (req, res) => {
    User.findOneAndRemove({
        _id: req.params.id
    }, (err, user) => {
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

// router.get('/:email', (req, res) => {
//     User.findOne({
//         email: req.params.email
//     }, {
//         password: false,
//         salt: false
//     })
//     .populate('current_company')
//     .populate('belong_project')
//     .exec((err, user) => {
//         if (err) console.log(err);
//         if (!user) {
//             return res.json({
//                 success: false,
//                 message: 'Email not found.'
//             });
//         }
//         return res.json({
//             success: true,
//             message: 'Your user info',
//             user: user
//         });
//     });
// });

router.put('/image/:id', upload.any(), async(req, res) => {
    var userUpdated = await User.findByIdAndUpdate(req.params.id, {
            $set: {
                image: `/assets/images/${req.files[0].filename}`
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
        .exec();
    if (userUpdated) {
        return res.json({
            success: true,
            message: "Upload Success",
            user: userUpdated
        });
    }
    return res.json({
        success: false,
        message: "Upload Failed"
    });

});

module.exports = router;