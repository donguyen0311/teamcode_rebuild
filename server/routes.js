const express = require('express');
var router = express.Router();
const config = require('./config/default');
const User = require('./models/user');
const Project = require('./models/project');
const Company = require('./models/company');
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
const routeEstimate = require('./routes/routeEstimate');

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
    .exec((err, user) => {
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
                username: req.body.username,
                email: req.body.email,
                password: password_sha512.password_encrypt,
                salt: password_sha512.salt
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
                            message: 'Ppdate user failed.'
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

router.get('/setup', (req, res) => {
    var nick = new User({
        username: 'dont',
        email: 'donguyen0311@gmail.com',
        password: '123456',
        salt: '231331',
        rand: 'asdsadas',
        name: 'tando',
        docker: [{
            dockername: 'demodocker',
            hostname: 'demo.tando.com',
            portSSH: 22
        }],
        admin: true
    });

    nick.save((err) => {
        if (err) throw err;
        console.log('User saved successfully');
        return res.json({
            success: true
        });
    });
});

router.get('/getallusers', (req, res) => {
    User.find({}, (err, users) => {
        return res.json(users);
    });
});

router.get('/setup/project', (req, res) => {
    var project = new Project({
        projectname: 'demoproject',
        contributors: [{
            username: 'dont',
            permission: 'admin',
            status: 'busy',
            time_join: new Date()
        }],
        tasks: [{
            task_name: 'do something',
            task_status: 'doing',
            user_create: 'dont',
            user_do: 'dont',
            content: 'try something special',
            note: 'this is new task'
        }]
    });
    project.save((err) => {
        if (err) throw err;
        console.log('Project saved successfully');
        return res.json({
            success: true
        });
    });
});

router.get('/getallprojects', (req, res) => {
    Project.find({}, (err, projects) => {
        return res.json(projects);
    });
});

router.put('/projects/:projectname', (req, res) => {
    //Project.findOne({
    //    projectname: req.params.projectname
    //}, (err, project) => {
    // var task = {
    //     task_name: 'do something____!!!!!',
    //     task_status: 'doing',
    //     user_create: 'dont',
    //     user_do: 'dont',
    //     content: 'try something special',
    //     note: 'this is new task'
    // };
    // project.tasks.push(task);
    // project.tasks.id('599582241a408327a074723b').remove();
    // project.save((err) => {
    //     if (err) throw err;
    //     console.log('Project changed successfully');
    //     return res.json({ success: true });
    // });
    // return res.json(project.tasks.id('59957e5e6177a00e04c64e06'));
    //});
    Project.findOneAndUpdate({
        projectname: req.params.projectname,
        'tasks._id': '5995a27acc81bc07388d5293'
    }, {
        $set: {
            'tasks.$.task_name': 'something wrong!!!',
            'tasks.$.note': 'test node change!~~~',
            'tasks.$.updatedAt': new Date()
        }
    }, {
        new: true
    }, (err, project) => {
        if (err) throw err;
        return res.json(project);
    });
});

module.exports = router;