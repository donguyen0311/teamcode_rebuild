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
    
    let requirement = req.body;
    User.find({
        analyst_capability: { $gte:  requirement.analyst_capability },
        programmer_capability: { $gte:  requirement.programmer_capability},
        application_experience: { $gte: requirement.application_experience },
        platform_experience: { $gte: requirement.platform_experience },
        language_and_toolset_experience: { $gte: requirement.language_and_toolset_experience },
        belong_project: []
    })
    .sort({
        salary: 1
    })
    .limit(parseInt(requirement.person_month))
    .exec((err, suitableStaffs) => {
        if(err) console.log(err);
        if(!suitableStaffs)
        {
            return res.json({
                success: false,
                message: 'Something wrong.'
            });
        }
        User.aggregate([
            {$match: {        
                analyst_capability: { $gte:  parseInt(requirement.analyst_capability) },
                programmer_capability: { $gte:  parseInt(requirement.programmer_capability)},
                application_experience: { $gte: parseInt(requirement.application_experience) },
                platform_experience: { $gte: parseInt(requirement.platform_experience) },
                language_and_toolset_experience: { $gte: parseInt(requirement.language_and_toolset_experience) }
                }
            },
            { $sort : { salary: 1 } },
            {$limit: parseInt(requirement.person_month)},
            {$group: {
                _id: '',
                projectCostPerMonth: { $sum: '$salary' }
                }
            }
        ],(err,result) => {
            if(err)
                console.log('err: '+err);
            res.json({
                success: true,
                message: 'all suitable staff',
                suitableStaffs: suitableStaffs,
                projectCostPerMonth: result ? result[0].projectCostPerMonth : 0
            }); 
        });
     
    });

});



module.exports = router;