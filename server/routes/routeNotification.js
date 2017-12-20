const express = require('express');
var router = express.Router();
const Notification = require('../models/notification');

router.get('/', (req, res) => {
    console.log(req.decoded.id);
    console.log(req.query)
    Notification
        .find({
            belong_user: req.decoded.id
        })
        .sort({'createdAt': -1})
        .skip(parseInt(req.query.offset) || 0)
        .limit(parseInt(req.query.limit) || 15)
        .exec((err, notifications) => {
            if (err) console.log(err);
            if (!notifications) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'Your notifications info',
                notifications: notifications
            });
        });
});

router.get('/status/:status', (req, res) => {
    console.log(req.decoded.id);
    Notification
        .find({
            belong_user: req.decoded.id,
            status: req.params.status
        })
        .exec((err, notifications) => {
            if (err) console.log(err);
            if (!notifications) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'Your notifications info',
                notifications: notifications.length
            });
        });
});

router.put('/status/:status', (req, res) => {
    console.log(req.decoded.id);
    Notification
        .update({
            belong_user: req.decoded.id,
            status: {$ne: 2}
        }, {
            $set: {"status": req.params.status}
        }, {
            "multi": true
        })
        .exec((err, notifications) => {
            if (err) console.log(err);
            if (!notifications) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'Your notifications info',
                notifications: 0
            });
        });
});

router.put('/:id/status/:status', (req, res) => {
    Notification
        .update({
            _id: req.params.id
        }, {
            $set: {"status": req.params.status}
        })
        .exec((err, notifications) => {
            if (err) console.log(err);
            if (!notifications) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'Update notifications status success'
            });
        });
});

module.exports = router;