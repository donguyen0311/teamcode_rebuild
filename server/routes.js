const express = require('express');
var router = express.Router();
const config = require('./config/default');
const User = require('./models/user');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const md5 = require('md5');

// router.get('/', (req, res) => {
//     res.render('index');
// });

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
        })
    }
}

router.get('/', (req, res) => {
    res.json({
        message: 'Welcome to API'
    });
});

router.get('/users/:email', middlewareAuth, (req, res) => {
    //console.log(req.decoded._doc.name);
    User.findOne({
        email: req.params.email
    }, (err, user) => {
        if (!user) {
            return res.json({
                success: false,
                message: 'Email not found.'
            });
        }
        user.password = null;
        return res.json({
            success: true,
            message: 'Your user info',
            user: user
        });
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
                message: 'Authentication failed. Email not found.'
            });
        } else if (user) {
            if (user.password != md5(req.body.password)) {
                return res.json({
                    success: false,
                    message: 'Authentication failed. Wrong password.'
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
    })
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
                })
            });
        }
    });

});

// router.get('/setup', (req, res) => {
//     var nick = new User({
//         username: 'dont',
//         email: 'donguyen0311@gmail.com',
//         password: '123456',
//         admin: true
//     });

//     nick.save((err) => {
//         if (err) throw err;
//         console.log('User saved successfully');
//         res.json({ success: true });
//     })
// });

module.exports = router;