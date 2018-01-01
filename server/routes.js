const express = require('express');
var router = express.Router();
const config = require('./config/default');
const User = require('./models/user');
const Project = require('./models/project');
const Company = require('./models/company');
const Task = require('./models/task');
const Notification = require('./models/notification');
const helper = require('./helper');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const multer = require('multer');
const path = require('path');
const routeUser = require('./routes/routeUser');
const routeCompany = require('./routes/routeCompany');
const routeProject = require('./routes/routeProject');
const routeTask = require('./routes/routeTask');
const routeNotification = require('./routes/routeNotification');
const routeActivity = require('./routes/routeActivity');
const routeEstimate = require('./routes/routeEstimate');
const _ = require('lodash');

const routeTree = require('./routes/routeTree');

var middlewareAuth = function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, config.secret_key, (err, decoded) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.send({
            success: false,
            message: 'No token provied.'
        });
    }
};

router.use('/estimate', middlewareAuth, routeEstimate);
router.use('/users', middlewareAuth, routeUser);
router.use('/projects', middlewareAuth, routeProject);
router.use('/companies', middlewareAuth, routeCompany);
router.use('/tasks', middlewareAuth, routeTask);
router.use('/notifications', middlewareAuth, routeNotification);
router.use('/activities', middlewareAuth, routeActivity);
router.use('/trees', routeTree);

router.get('/', (req, res) => {
    res.json({
        message: 'Welcome to API'
    });
});

router.get('/checkCompany/:company_name', (req, res) => {
    Company
        .findOne({
            company_name: req.params.company_name
        })
        .exec((err, company) => {
            if (err) console.log(err);
            if (!company) {
                return res.json({
                    success: false,
                    message: 'Company not found.'
                });
            }
            return res.json({
                success: true,
                message: 'Company is found.'
            });
        });
})

router.get('/authenticate', middlewareAuth, (req, res) => {
    User.findOne({
        _id: req.decoded.id
    }, (err, user) => {
        if (err) throw err;

        if (!user) {
            return res.json({
                success: false,
                message: 'Authentication failed. Email not found.'
            });
        } else {
            return res.json({
                success: true,
                message: 'Authentication successful.'
            });
        }
    });
});

router.post('/login', (req, res) => {
    User.findOne({
        email: req.body.email
    })
    .populate('current_company')
    .exec(async (err, user) => {
        if (err) throw err;

        if (!user) {
            return res.json({
                success: false,
                //message: 'Authentication failed. Email not found.'
                message: 'Login failed. Invalid Email or Password.'
            });
        } else if (user) {
            if (req.body.company_name !== user.current_company.company_name) {
                return res.json({
                    success: false,
                    // message: 'Authentication failed. Wrong password.'
                    message: 'Login failed. Invalid Email or Password.'
                });
            }
            else if (!helper.compareSync(req.body.password, user.salt, user.password)) {
                return res.json({
                    success: false,
                    // message: 'Authentication failed. Wrong password.'
                    message: 'Login failed. Invalid Email or Password.'
                });
            } else {
                var token = jwt.sign({
                    id: user._id
                }, config.secret_key, {
                    expiresIn: "1d"
                });
                if (user.status === 0) {
                    await User.findByIdAndUpdate(user._id, {
                        $set: {
                            status: 1
                        }
                    }).exec();
                }
                return res.json({
                    success: true,
                    message: 'Login success.',
                    token: token
                });
            }
        }
    });
});

router.post('/register', (req, res) => {
    User.findOne({
        email: req.body.email
    }, async (err, user) => {
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
                username: req.body.username,
                email: req.body.email,
                password: password_sha512.password_encrypt,
                salt: password_sha512.salt,
                admin: 1,
                status: 1
            });
            var createdUser = await newUser.save();
            if (createdUser) {
                var newCompany = new Company({
                    company_name: req.body.company_name,
                    created_by: createdUser._id
                });
                var createdCompany = await newCompany.save();
                if (createdCompany) {
                    var updatedUser = await User.findByIdAndUpdate(createdUser._id, {
                        $set: {
                            current_company: createdCompany._id
                        }
                    }).exec();
                    if (updatedUser) {
                        return res.json({
                            success: true,
                            message: 'Register successfully.'
                        });
                    } else {
                        return res.json({
                            success: false,
                            message: 'Update user failed.'
                        });
                    }
                } else {
                    return res.json({
                        success: false,
                        message: 'Register company failed.'
                    });
                }
            } else {
                return res.json({
                    success: false,
                    message: 'Register user failed.'
                });
            }
            
        }
    });

});

router.get('/caculate_project_warning', async(req, res) => { // updating...
    var currentDate = new Date();
    var projects = await Project
        .find({})
        .exec();
    for (let project of projects) {
        var tasks = await Task
            .find({belong_project: project._id})
            .exec();
        for (let task of tasks) {
            if (currentDate > new Date(task.end_day) && (task.status == 'TODO' || task.status == 'INPROGRESS')) {
                for (let responsible_user of task.responsible_user) {
                    project
                        .point_list
                        .push({id: responsible_user});
                }
                let statusSaved = await project.save();
                if (!statusSaved) {
                    return res.json({success: false, message: 'Save point list failed.'});
                }
            }
        }
        var arrayPoint = _.countBy(project.point_list, 'id');
        for (let pointById in arrayPoint) {
            if (arrayPoint[pointById] > 5) {
                project.warning_list = {
                    ...project.warning_list,
                    [pointById]: arrayPoint[pointById]
                };
            }
        }
        let statusSaved = await project.save();
        if (!statusSaved) {
            return res.json({success: false, message: 'Save point list failed.'});
        }
    }
    return res.json({success: true, message: 'Caculate Successful.'});
});

module.exports = router;