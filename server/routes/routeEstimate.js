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
const _ = require('lodash');

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

var staffsDB = [
    {
        _id: 1,
        name: 'Nguyễn Tấn Đô',
        salary: 500,
        work_time:{
            office: 3
        }
    },
    {
        _id: 2,
        name: 'Nguyễn Văn A',
        salary: 700,
        work_time:{
            office: 1
        }
    },
    {
        _id: 5,
        name: 'Nguyễn Phong',
        salary: 1000,
        work_time:{
            office: 3
        }
    },
    {
        _id: 3,
        name: 'Đỗ Nam',
        salary: 400,
        work_time:{
            office: 5
        }
    },
    {
        _id: 10,
        name: 'Văn Cao',
        salary: 650,
        work_time:{
            office: 4
        }
    },
    {
        _id: 67,
        name: 'Nguyễn Lộc',
        salary: 350,
        work_time:{
            office: 2
        }
    },
    {
        _id: 89,
        name: 'Nguyễn Phạm',
        salary: 250,
        work_time:{
            office: 4
        }
    }
];

var projectTime = 3;

function CaculateStaff(staffs, projectDuration /*Effort*/) { 
    let projectByHours = projectDuration * 152;
    let staffsWithSalaryForOneHours = staffs.map((staff) => {
        staff.salaryForOneHours = staff.salary / 152;
        return staff;
    });
    let sortStaffsSalaryForOneHours = _.sortBy(staffsWithSalaryForOneHours, ['salaryForOneHours']);
    let staffsWithSalaryForTimeAvailable = sortStaffsSalaryForOneHours.map((staff) => {
        staff.salaryForTimeAvailable = staff.salaryForOneHours * (8 - staff.work_time.office);
        return staff;
    });
    for(let iStaff = 0; iStaff < staffsWithSalaryForTimeAvailable.length; iStaff++) {
        let chosenStaffs = _.slice(staffsWithSalaryForTimeAvailable, 0, iStaff + 1);
        let sumTimeOfNStaffs = SumTimeOfNStaffs(chosenStaffs, projectDuration);
        if(sumTimeOfNStaffs >= projectByHours) {
            let extraTime = sumTimeOfNStaffs - projectByHours;
            // console.log(extraTime);
            chosenStaffs = chosenStaffs.map((staff) => {
                staff.month_spend = projectDuration;
                return staff;
            });
            let modifyTimeOfLastStaff = ( (8 - chosenStaffs[iStaff].work_time.office) * 4 * 5 * 0.95 * projectDuration - extraTime) / ( (8 - chosenStaffs[iStaff].work_time.office) * 4 * 5 * 0.95);
            // console.log(modifyTimeOfLastStaff);
            chosenStaffs[iStaff].month_spend = modifyTimeOfLastStaff;
            let totalBudget = 0;
            for(let i = 0; i < chosenStaffs.length; i++) {
                totalBudget += chosenStaffs[i].salaryForTimeAvailable * 4 * 5 * 0.95 * chosenStaffs[i].month_spend;
            }
            // console.log(totalBudget);
            return {staffs: chosenStaffs, total_budget: totalBudget};
        }
    }
    return false;
}

function SumTimeOfNStaffs(staffs, projectDuration) { 
    let sumTime = 0;
    for(let i = 0; i < staffs.length; i++) {
        sumTime += (8 - staffs[i].work_time.office) * 4 * 5 * 0.95 * projectDuration;
    }
    //console.log(sumTime, '==========================');
    return sumTime;
}

// var result = CaculateStaff(staffsDB, projectTime);
// console.log(result);

function combinations(array)
{
    var result = [];
    
        var loop = function (start,depth,prefix)
        {
            for(var i=start; i<array.length; i++)
            {
                var next = [...prefix, array[i]];
    
                if (depth > 0)
                    loop(i+1,depth-1,next);
                else {
    
                  result.push(next);
                }
                    
            }
        }
    
    for(var i=0; i<array.length; i++)
    {
        loop(0,i, []);
    }

    return result;
}

function bruteforce(staffs, projectDuration) {
    let projectByHours = projectDuration * 152;
    staffs.map((staff) => {
        staff.salaryForOneHours = staff.salary / 152;
        return staff;
    });
    let minStaff = [];
    let sumSalary = 0;
    var count = 0;
    var arrayChosenStaffs = combinations(staffs);

    let bruteforceStaffs = [];
    // for(let x = 0; x < staffs.length; x++) {
    //     for(let i = x - 1; i < staffs.length; i++) {
    //         for(let k = i + 1; k < staffs.length; k++) {
    //             let sliceStaffs = _.slice(staffs, x, i + 1); 
    //             let chosenStaffs = [...sliceStaffs, staffs[k]];
    //             let sumTimeOfNStaffs = SumTimeOfNStaffs(chosenStaffs, projectDuration);
    //             if(sumTimeOfNStaffs > projectByHours) {
    //                 if(minStaff.length === 0) {
    //                     minStaff = [...chosenStaffs];
    //                     sumSalary = caculateSalary(chosenStaffs, projectDuration);
    //                 }
    //                 else if(caculateSalary(chosenStaffs, projectDuration) < caculateSalary(minStaff, projectDuration)) {
    //                     minStaff = [...chosenStaffs];
    //                     sumSalary = caculateSalary(chosenStaffs, projectDuration);
    //                 }
    //             }
    //         }
    //     }
    // }
    for(let [chosenStaffsIndex, chosenStaffs] of arrayChosenStaffs.entries()) { 
        bruteforceStaffs.push({staffs: chosenStaffs});

        // let sumTimeOfNStaffs = SumTimeOfNStaffs(chosenStaffs, projectDuration);

        bruteforceStaffs[chosenStaffsIndex]['timeAffordable'] = SumTimeOfNStaffs(chosenStaffs, projectDuration);
        bruteforceStaffs[chosenStaffsIndex]['cost'] = caculateSalary(chosenStaffs, projectDuration);

        // if(sumTimeOfNStaffs > projectByHours) {
        //     if(minStaff.length === 0) {
        //         minStaff = [...chosenStaffs];
        //         sumSalary = caculateSalary(chosenStaffs, projectDuration);
        //     }
        //     else if(caculateSalary(chosenStaffs, projectDuration) < caculateSalary(minStaff, projectDuration)) {
        //         minStaff = [...chosenStaffs];
        //         sumSalary = caculateSalary(chosenStaffs, projectDuration);
        //     }
        // }
    }
    // console.log(count);

    // console.log('minStaff:', minStaff);
    // console.log('sumSalary:', sumSalary);
    // console.log(arrayChosenStaffs);
    // console.log(bruteforceStaffs);
    return bruteforceStaffs;
}

function caculateSalary(staffs, projectDuration) {
    let sumSalary = 0;
    let sumTimeOfNStaffs = SumTimeOfNStaffs(staffs, projectDuration);
    let extraTime = sumTimeOfNStaffs - projectDuration * 152;
    let sortStaffsSalaryForOneHours = _.sortBy(staffs, ['salaryForOneHours']);
    sortStaffsSalaryForOneHours.map((staff) => {
        staff.timeWork = (8 - staff.work_time.office) * 4 * 5 * 0.95 * projectDuration;
        return staff;
    });
    if(extraTime > 0)
    {
        // console.log('=============');
        // console.log(sortStaffsSalaryForOneHours.length);
        // console.log('=============');
        sortStaffsSalaryForOneHours[sortStaffsSalaryForOneHours.length - 1].timeWork = (8 - sortStaffsSalaryForOneHours[sortStaffsSalaryForOneHours.length - 1].work_time.office) * 4 * 5 * 0.95 * projectDuration - extraTime;
        
        //most cost staff is useless
        if (sortStaffsSalaryForOneHours[sortStaffsSalaryForOneHours.length - 1].timeWork < 0) {
            return Number.MAX_SAFE_INTEGER;
        }
    }

    for(let i = 0; i < sortStaffsSalaryForOneHours.length; i++) {
        sumSalary += sortStaffsSalaryForOneHours[i].timeWork * sortStaffsSalaryForOneHours[i].salaryForOneHours;
    }
    // console.log(sumSalary, '==========================');
    return sumSalary;
}

// bruteforce(staffsDB, projectTime);

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
                projectCostPerMonth: (result[0] !== undefined) ? result[0].projectCostPerMonth : 0
            }); 
        });
     
    });
});

router.post('/bruteforceStaff', (req, res) => {
    
    let requirement = req.body;
    User.find({
        analyst_capability: { $gte:  requirement.analyst_capability },
        programmer_capability: { $gte:  requirement.programmer_capability},
        application_experience: { $gte: requirement.application_experience },
        platform_experience: { $gte: requirement.platform_experience },
        language_and_toolset_experience: { $gte: requirement.language_and_toolset_experience },
        belong_project: [],
        'work_time.office': { $ne: 8 }
    })
    .sort({
        salary: 1
    })
    .limit(parseInt(requirement.person_month))
    .exec((err, satisfiedRequirementStaffs) => {
        if(err) console.log(err);
        if(!satisfiedRequirementStaffs)
        {
            return res.json({
                success: false,
                message: 'Something wrong.'
            });
        }
        else
        {

            res.json({
                success: true,
                message: 'all suitable staff',
                bruteforceStaffs: bruteforce(satisfiedRequirementStaffs, requirement.projectDuration)
            }); 
        }
    });
});



module.exports = router;