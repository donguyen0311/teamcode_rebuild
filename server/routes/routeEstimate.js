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

router.post('/suitableStaff', (req, res) => {
    //nos chuaw vo ođây luôn á ma`
    //tại vì bên này chưa cần requirêmnt nên để trống
    User.find({
        analyst_capability: { $gte:  2 },
        programmer_capability: { $gte:  4},
        personnel_continuity: { $gte: 2 },
        platform_experience: { $gte: 1 },
        language_and_toolset_experience: { $gte: 2 }
    })
    .sort({
        salary: 1
    })
    .limit(6)
    .exec((err, suitableStaff) => {
        if(err) console.log(err);
        if(!suitableStaff)
        {
            return res.json({
                success: false,
                message: 'Something wrong.'
            });
        }      
        res.json({
            success: true,
            message: 'all suitable staff',
            suitableStaff: suitableStaff
        });      
    });
});



module.exports = router;