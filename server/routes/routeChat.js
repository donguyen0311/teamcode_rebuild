const express = require('express');
var router = express.Router();
const Chat = require('../models/chat');
const User = require('../models/user');
const Project = require('../models/project');

router.get('/projects/:id', (req, res) => {
    console.log(req.decoded.id);
    Chat
        .find({
            to: req.params.id
        })
        .populate({
            path: 'from',
            select: 'email image username firstname lastname'
        })
        .populate('to')
        .sort({'createdAt': -1})
        .skip(parseInt(req.query.offset) || 0)
        .limit(parseInt(req.query.limit) || 30)
        .exec((err, chats) => {
            if (err) console.log(err);
            if (!chats) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'Your messages info',
                messages: chats
            });
        });
   
});

module.exports = router;