const express = require('express');
var router = express.Router();
const config = require('./config/default');
const User = require('./models/user');
const Project = require('./models/project');
const helper = require('./helper');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const multer = require('multer');
const path = require('path');

let upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, path.join(__dirname, '..', 'client/assets/images'));
        },
        filename: (req, file, callback) => {
            //originalname is the uploaded file's name with extn
            callback(null, file.originalname);
        }
    })
});

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
        return res.status(403).send({
            success: false,
            message: 'No token provied.'
        });
    }
};

router.get('/', (req, res) => {
    res.json({
        message: 'Welcome to API'
    });
});

router.get('/users/:email', middlewareAuth, (req, res) => {
    //console.log(req.decoded._doc.name);
    User.findOne({
        email: req.params.email
    }, {
        password: false
    }, (err, user) => {
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

router.put('/users/image', upload.any(), (req, res) => {
    res.status(200).json({
        code: 200,
        message: "Upload Sucess"
    });
});

router.post('/authenticate', (req, res) => {
    User.findOne({
        email: req.body.email
    }, (err, user) => {
        if (err) throw err;

        if (!user) {
            return res.json({
                success: false,
                //message: 'Authentication failed. Email not found.'
                message: 'Authentication failed. Invalid Email or Password.'
            });
        } else if (user) {
            if (user.password != md5(req.body.password)) {
                return res.json({
                    success: false,
                    // message: 'Authentication failed. Wrong password.'
                    message: 'Authentication failed. Invalid Email or Password.'
                });
            } else {
                var token = jwt.sign(user, config.secret_key, {
                    expiresIn: "1d"
                });
                return res.json({
                    success: true,
                    message: 'Login successfully.',
                    token: token
                });
            }
        }
    });
});

router.post('/register', (req, res) => {
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
            var newUser = new User({
                username: req.body.username,
                email: req.body.email,
                password: md5(req.body.password),
                admin: req.body.admin
            });
            newUser.save((err) => {
                if (err) console.log(err);
                return res.json({
                    success: true,
                    message: 'Register successfully.'
                });
            });
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