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

async function caculateUserInDB() {
    var projectTime = 5;
    var personMonth = 9.87;
    var users = await User.find({'work_time.office': { $ne: 8 }, 'work_time.overtime': { $ne: 4 }}, {
        password: false,
        salt: false
    });
    console.log('users', users.length);
    var result = CaculateStaff([...users], projectTime, personMonth);
    console.log(result.work_office_staffs.length, result);
    //console.log(result[0].monthSpend);
}

//caculateUserInDB();

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
  
function CaculateStaff(staffs, projectDuration, personMonths /*Effort*/ , performanceList) { 
    //console.log('performanceList: ', performanceList);
    let projectByHours = personMonths * 152;
    let listStaffs = staffs.map(staff => staff._doc); // get only data info of user
    let staffsWithSalaryForOneHoursOffice = _.map(_.cloneDeep(listStaffs), (staff) => {
        staff.salaryForOneHours = staff.salary / 152;
        staff.typeWork = 'OFFICE';
        return staff;
    });
    let staffsWithSalaryForOneHoursOverTime = _.map(_.cloneDeep(listStaffs), (staff) => {
        staff.salaryForOneHours = (staff.salary / 152) * 2;
        staff.typeWork = 'OVERTIME';
        return staff;
    });
    let sortStaffsSalaryForOneHours = _.sortBy([...staffsWithSalaryForOneHoursOffice, ...staffsWithSalaryForOneHoursOverTime], ['salaryForOneHours']);
    // let staffsWithSalaryForTimeAvailable = [...sortStaffsSalaryForOneHours].map((staff) => {
    //     staff.salaryForTimeAvailable = staff.salaryForOneHours * (8 - staff.work_time.office);
    //     return staff;
    // });
    for(let iStaff = 0; iStaff < sortStaffsSalaryForOneHours.length; iStaff++) {
        let chosenStaffs = _.slice(sortStaffsSalaryForOneHours, 0, iStaff + 1);
        let sumTimeOfNStaffs = SumTimeOfNStaffs(chosenStaffs, projectDuration, performanceList);
        if(sumTimeOfNStaffs >= projectByHours) {
            let extraTime = sumTimeOfNStaffs - projectByHours;
            // console.log(extraTime);
            chosenStaffs = _.map(chosenStaffs, (staff) => {
                staff.monthSpend = projectDuration;
                return staff;
            });
            console.log('sumTimeOfNStaffs: ', sumTimeOfNStaffs);
            console.log('extraTime: ', extraTime);
            // console.log('chosenStaffs[iStaff]: ', chosenStaffs[iStaff]);
            let modifyTimeOfLastStaff = (chosenStaffs[iStaff].typeWork === 'OFFICE') ? 
                                            ( (8 - chosenStaffs[iStaff].work_time.office) * 4 * 5 * 0.95 * projectDuration * ReferenceStaffWithPerformanceList(chosenStaffs[iStaff], performanceList) - extraTime ) / 
                                                ( (8 - chosenStaffs[iStaff].work_time.office) * 4 * 5 * 0.95 * ReferenceStaffWithPerformanceList(chosenStaffs[iStaff], performanceList) ) : 
                                            ( (8 - chosenStaffs[iStaff].work_time.overtime) * 4 * 5 * 0.95 * projectDuration * ReferenceStaffWithPerformanceList(chosenStaffs[iStaff], performanceList) - extraTime ) / 
                                                ( (8 - chosenStaffs[iStaff].work_time.overtime) * 4 * 5 * 0.95 * ReferenceStaffWithPerformanceList(chosenStaffs[iStaff], performanceList) );
            //console.log(modifyTimeOfLastStaff);
            chosenStaffs[iStaff].monthSpend = modifyTimeOfLastStaff;
            let totalCost = 0;
            let totalTimeSpend = 0;
            let listStaffMonthSpend = [];
            for(let i = 0; i < chosenStaffs.length; i++) {
                totalCost += (chosenStaffs[i].typeWork === 'OFFICE') ? chosenStaffs[i].salaryForOneHours * (8 - chosenStaffs[i].work_time.office) * 4 * 5 * 0.95 * chosenStaffs[i].monthSpend :
                                                                        chosenStaffs[i].salaryForOneHours * (8 - chosenStaffs[i].work_time.overtime) * 4 * 5 * 0.95 * chosenStaffs[i].monthSpend;
                totalTimeSpend += (chosenStaffs[i].typeWork === 'OFFICE') ? (8 - chosenStaffs[i].work_time.office) * 4 * 5 * 0.95 * chosenStaffs[i].monthSpend * ReferenceStaffWithPerformanceList(chosenStaffs[i], performanceList) : 
                                                                            (8 - chosenStaffs[i].work_time.overtime) * 4 * 5 * 0.95 * chosenStaffs[i].monthSpend * ReferenceStaffWithPerformanceList(chosenStaffs[i], performanceList);

            }
            //console.log(chosenStaffs[0].monthSpend);
            return { work_office_staffs: chosenStaffs, total_cost: totalCost, total_time_spend: totalTimeSpend };
        }
    }
    return { work_office_staffs: [], total_cost: 0, total_time_spend: 0 };
}

function SumTimeOfNStaffs(staffs, projectDuration, performanceList) { 
    let sumTime = 0;
    for(let i = 0; i < staffs.length; i++) {
        if(staffs[i].typeWork === 'OFFICE') {
            sumTime += (8 - staffs[i].work_time.office) * 4 * 5 * 0.95 * projectDuration * ReferenceStaffWithPerformanceList(staffs[i], performanceList);
        }
        else {
            sumTime += (8 - staffs[i].work_time.overtime) * 4 * 5 * 0.95 * projectDuration * ReferenceStaffWithPerformanceList(staffs[i], performanceList);
        }  
    }
    return sumTime;
}

function ReferenceStaffWithPerformanceList(staff, performanceList) {
    var keyAbility = `{ACAP: ${staff.analyst_capability}, PCAP: ${staff.programmer_capability}, APEX: ${staff.application_experience}, PLEX: ${staff.platform_experience}, LTEX: ${staff.language_and_toolset_experience}}`;
    return performanceList[keyAbility];
}

// var result = CaculateStaff(staffsDB, projectTime);
// console.log(result);

function combinations(array) {
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

function bruteforce(staffs, projectDuration,personMonths, performanceList) {
    let projectByHours = personMonths * 152;
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

        bruteforceStaffs[chosenStaffsIndex]['timeAffordable'] = SumTimeOfNStaffs(chosenStaffs, projectDuration, performanceList);
        bruteforceStaffs[chosenStaffsIndex]['cost'] = caculateSalary(chosenStaffs, projectDuration,personMonths);

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

function caculateSalary(staffs, projectDuration, personMonths) {
    let sumSalary = 0;
    let sumTimeOfNStaffs = SumTimeOfNStaffs(staffs, projectDuration);
    let extraTime = sumTimeOfNStaffs - personMonths * 152;
    let sortStaffsSalaryForOneHours = _.sortBy(staffs, ['salaryForOneHours']);
    sortStaffsSalaryForOneHours.map((staff) => {
        staff.timeWork = (8 - staff.work_time.office) * 4 * 5 * 0.95 * projectDuration;
        return staff;
    });
    if(extraTime > 0)
    {
        // console.log('=============');
        // console.log(sumTimeOfNStaffs);
        // console.log(extraTime);
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

// router.post('/suitableStaff', (req, res) => {
    
//     let requirement = req.body;
//     User.find({
//         analyst_capability: { $gte:  requirement.analyst_capability },
//         programmer_capability: { $gte:  requirement.programmer_capability},
//         application_experience: { $gte: requirement.application_experience },
//         platform_experience: { $gte: requirement.platform_experience },
//         language_and_toolset_experience: { $gte: requirement.language_and_toolset_experience },
//         belong_project: []
//     })
//     .sort({
//         salary: 1
//     })
//     .limit(parseInt(requirement.person_month))
//     .exec((err, suitableStaffs) => {
//         if(err) console.log(err);
//         if(!suitableStaffs)
//         {
//             return res.json({
//                 success: false,
//                 message: 'Something wrong.'
//             });
//         }
//         User.aggregate([
//             {$match: {        
//                 analyst_capability: { $gte:  parseInt(requirement.analyst_capability) },
//                 programmer_capability: { $gte:  parseInt(requirement.programmer_capability)},
//                 application_experience: { $gte: parseInt(requirement.application_experience) },
//                 platform_experience: { $gte: parseInt(requirement.platform_experience) },
//                 language_and_toolset_experience: { $gte: parseInt(requirement.language_and_toolset_experience) }
//                 }
//             },
//             { $sort : { salary: 1 } },
//             {$limit: parseInt(requirement.person_month)},
//             {$group: {
//                 _id: '',
//                 projectCostPerMonth: { $sum: '$salary' }
//                 }
//             }
//         ],(err,result) => {
//             if(err)
//                 console.log('err: '+err);
//             res.json({
//                 success: true,
//                 message: 'all suitable staff',
//                 suitableStaffs: suitableStaffs,
//                 projectCostPerMonth: (result[0] !== undefined) ? result[0].projectCostPerMonth : 0
//             }); 
//         });
     
//     });
// });

router.post('/suitableStaff', (req, res) => {
    console.log('================aaaaa');
    // var projectTime = 5;
    // var users = await User.find({'work_time.office': { $ne: 8 }}, {
    //     password: false,
    //     salt: false
    // });
    // console.log('users', users.length);
    // var result = CaculateStaff([...users], projectTime);
    // console.log(result);
    //console.log(result[0].month_spend);

    let requirement = req.body;
    //console.log(requirement);
    //console.log(requirement.performanceTable);
    User.find({
        analyst_capability: { $gte:  requirement.analyst_capability },
        programmer_capability: { $gte:  requirement.programmer_capability},
        application_experience: { $gte: requirement.application_experience },
        platform_experience: { $gte: requirement.platform_experience },
        language_and_toolset_experience: { $gte: requirement.language_and_toolset_experience },
        belong_project: [],
        'work_time.office': { $ne: 8 },
        'work_time.overtime': { $ne: 4 }
    }, {
        password: false,
        salt: false
    })
    .sort({
        salary: 1
    })
    .limit(parseInt((requirement.person_month === undefined) ? 1 : requirement.person_month))
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
            let suitableStaffsInfos = CaculateStaff([...satisfiedRequirementStaffs], requirement.projectDuration, requirement.personMonths, requirement.performanceTable);
            res.json({
                success: true,
                message: 'all suitable staff',
                suitableStaffs: suitableStaffsInfos.work_office_staffs,
                projectCostPerMonth: suitableStaffsInfos.total_cost/requirement.projectDuration,
                projectCost: suitableStaffsInfos.total_cost,
                totalTimeSpend: suitableStaffsInfos.total_time_spend
            }); 
        }
    });
});

router.post('/bruteforceStaff', (req, res) => {
    
    let requirement = req.body;
    console.log(requirement);
    User.find({
        analyst_capability: { $gte:  requirement.analyst_capability },
        programmer_capability: { $gte:  requirement.programmer_capability},
        application_experience: { $gte: requirement.application_experience },
        platform_experience: { $gte: requirement.platform_experience },
        language_and_toolset_experience: { $gte: requirement.language_and_toolset_experience },
        belong_project: [],
        'work_time.office': { $ne: 8 },
        'work_time.overtime': { $ne: 4 }
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
                bruteforceStaffs: bruteforce(satisfiedRequirementStaffs, requirement.projectDuration,requirement.personMonths, requirement.performanceTable)
            }); 
        }
    });
});



module.exports = router;