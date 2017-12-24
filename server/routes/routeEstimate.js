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
const moment = require('moment');
// const momentDurationFormatSetup = require('moment-duration-format');
// momentDurationFormatSetup(moment);
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

// async function caculateUserInDB() {
//     var projectDuration = 3;
//     var personMonth = 9.87;
//     var projectWillCreate = {
//         start_day: new Date(2018,01,02),
//         end_day: new Date(2018,04,02)
//     }
//     var users = await User.find({'work_time.office': { $ne: 8 }, 'work_time.overtime': { $ne: 4 }}, {
//         password: false,
//         salt: false
//     });
//     console.log('users', users.length);
//     var result = CaculateStaff([...users], projectDuration, personMonth, performanceList, projectWillCreate);
//     console.log(result.work_office_staffs.length, result);
//     //console.log(result[0].monthSpend);
// }

// caculateUserInDB();

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
  
function CaculateStaff(staffs, projectDuration, personMonths /*Effort*/ , performanceList, projectWillCreate) { 
    //console.log('performanceList: ', performanceList);
    let projectByHours = personMonths * 152;
    // console.log('projectByHours: ', projectByHours);
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
    
    let sortStaffsSalaryForOneHours = _.sortBy([
        ...staffsWithSalaryForOneHoursOffice,
        ...staffsWithSalaryForOneHoursOverTime
    ], ['salaryForOneHours']);

    // filter staff work < 10% project duration
    let filterStaffs = _.filter(sortStaffsSalaryForOneHours, (staff) => {
        // caculate timeline
        let timeline = generateTimeline(staff, projectWillCreate);
        //caculate available time
        let arrayAvailableHour = combineAvailableHourToTimeline(staff, timeline);
        let sumAvailableHour = 0;
        if (staff.typeWork === 'OFFICE') {
            for (let availableHour of arrayAvailableHour) {
                if(availableHour.office > 0) {
                    sumAvailableHour += durationMonthFormat(availableHour.from, availableHour.to);
                }
            }
            if ((sumAvailableHour / projectDuration) < 0.9) {
                return false;
            }
            return true;
        } else {
            for (let availableHour of arrayAvailableHour) {
                if(availableHour.overtime > 0) {
                    sumAvailableHour += durationMonthFormat(availableHour.from, availableHour.to);
                }
            }
            if ((sumAvailableHour / projectDuration) < 0.9) {
                return false;
            }
            return true;
        }   
    });
    // console.log('filterStaffs',filterStaffs);
    for (let iStaff = 0; iStaff < filterStaffs.length; iStaff++) {
        let chosenStaffs = _.slice(filterStaffs, 0, iStaff + 1);
        let sumTimeOfNStaffs = SumTimeOfNStaffs(chosenStaffs, projectDuration, performanceList, projectWillCreate); // issue here
        if (sumTimeOfNStaffs >= projectByHours) {
            // console.log('sumTimeOfNStaffs Not Filter Last Staff',sumTimeOfNStaffs);
            let extraTime = sumTimeOfNStaffs - projectByHours;
            chosenStaffs = _.map(chosenStaffs, (staff) => {
                staff.monthSpend = projectDuration;
                // caculate timeline
                let timeline = generateTimeline(staff, projectWillCreate);
                //caculate available time
                let arrayAvailableHour = combineAvailableHourToTimeline(staff, timeline);
                staff.timeOfDayForProject = arrayAvailableHour;
                return staff;
            });
            // console.log('before - extraTime: ', chosenStaffs);
            // console.log('sumTimeOfNStaffs: ', sumTimeOfNStaffs);
            // console.log('extraTime: ', extraTime);
            // console.log('chosenStaffs: ', chosenStaffs);
            //chosenStaffs.map((staff) => console.log({typework: staff.typeWork, timeOfDayForProject: staff.timeOfDayForProject}));
            chosenStaffs[iStaff].timeOfDayForProject = caculateTimeOfLastStaff({...chosenStaffs[iStaff]}, extraTime, performanceList);
            // console.log('after - extraTime: ', chosenStaffs);
            // let modifyTimeOfLastStaff = (chosenStaffs[iStaff].typeWork === 'OFFICE') ? 
            //                                 ( (8 - chosenStaffs[iStaff].work_time.office) * 4 * 5 * 0.95 * projectDuration * ReferenceStaffWithPerformanceList(chosenStaffs[iStaff], performanceList) - extraTime ) / 
            //                                     ( 4 * 5 * 0.95 * projectDuration * ReferenceStaffWithPerformanceList(chosenStaffs[iStaff], performanceList) ) : 
            //                                 ( (4 - chosenStaffs[iStaff].work_time.overtime) * 4 * 5 * 0.95 * projectDuration * ReferenceStaffWithPerformanceList(chosenStaffs[iStaff], performanceList) - extraTime ) / 
            //                                     ( 4 * 5 * 0.95 * projectDuration * ReferenceStaffWithPerformanceList(chosenStaffs[iStaff], performanceList) );
            //console.log(modifyTimeOfLastStaff);

            // chosenStaffs[iStaff].timeOfDayForProject = Math.ceil(modifyTimeOfLastStaff); // ceil number
            //console.log(chosenStaffs[iStaff]);
            // console.log(chosenStaffs);
            let {suitableStaffs, totalProjectCost, totalTimeTeamAfforable} = caculateSalaryBaseOnTimelineAndTotalProjectCost(chosenStaffs,performanceList);
            // chosenStaffs.map((staff) => console.log({_id: staff._id, salary: staff.salary, typework: staff.typeWork, timeOfDayForProject: staff.timeOfDayForProject, totalCost: staff.totalCost, affordableTime: staff.affordableTime}));
            chosenStaffs.map((staff) => console.log({typework: staff.typeWork, timeOfDayForProject: staff.timeOfDayForProject}));
            // console.log('totalProjectCost',totalProjectCost);
            // console.log('totalTimeTeamAfforable',totalTimeTeamAfforable);
            // console.log('suitableStaffs',suitableStaffs);
            // return;
            // let totalCost = 0;
            // let totalTimeSpend = 0;
            // let listStaffMonthSpend = [];
            // for(let i = 0; i < chosenStaffs.length; i++) {
            //     totalCost += chosenStaffs[i].salaryForOneHours * chosenStaffs[i].timeOfDayForProject * 4 * 5 * 0.95 * chosenStaffs[i].monthSpend;
            //     totalTimeSpend += chosenStaffs[i].timeOfDayForProject * 4 * 5 * 0.95 * chosenStaffs[i].monthSpend * ReferenceStaffWithPerformanceList(chosenStaffs[i], performanceList);

            // }
            // console.log('totalCost: ', totalCost);
            // console.log('totalTimeSpend: ', totalTimeSpend);
            //console.log(chosenStaffs[0].monthSpend);
            return {
                suitableStaffs: suitableStaffs, 
                totalProjectCost: totalProjectCost, 
                totalTimeTeamAfforable: totalTimeTeamAfforable
            };
        }
    }
    return { 
        suitableStaffs: [], 
        totalProjectCost: 0, 
        totalTimeTeamAfforable: 0 
    };
}

function caculateSalaryBaseOnTimelineAndTotalProjectCost(chosenStaffs, performanceList)
{
    // let chosenStaffsResult = [...chosenStaffs];
    let totalProjectCost = 0;
    let totalTimeTeamAfforable = 0;
    for(let staff of chosenStaffs)
    {
        staff['totalCost'] = 0;
        staff['affordableTime'] = 0;
        for(let timeFrame of staff.timeOfDayForProject)
        {
            if(staff.typeWork === 'OFFICE')
            {
               staff['totalCost'] += timeFrame.office*4*5*durationMonthFormat(timeFrame.from,timeFrame.to)*0.95*(staff.salary/152);
               totalTimeTeamAfforable += timeFrame.office*4*5*durationMonthFormat(timeFrame.from,timeFrame.to)*0.95*ReferenceStaffWithPerformanceList(staff, performanceList);
               staff['affordableTime'] += timeFrame.office*4*5*durationMonthFormat(timeFrame.from,timeFrame.to)*0.95*ReferenceStaffWithPerformanceList(staff, performanceList);
               // timeFrame['mutipleCostString'] = timeFrame.office+'*4*5'+'*'+durationMonthFormat(timeFrame.from,timeFrame.to)+'*0.95*'+staff.salary/152;
               // timeFrame['mutipleTimeString'] = timeFrame.office+'*4*5'+'*'+durationMonthFormat(timeFrame.from,timeFrame.to)+'*0.95*'+ReferenceStaffWithPerformanceList(staff, performanceList);
            }
            else
            {
                staff['totalCost'] += (timeFrame.overtime*4*5*durationMonthFormat(timeFrame.from,timeFrame.to)*0.95*(staff.salary/152))*2;
                totalTimeTeamAfforable += timeFrame.overtime*4*5*durationMonthFormat(timeFrame.from,timeFrame.to)*0.95*ReferenceStaffWithPerformanceList(staff, performanceList);;
                staff['affordableTime'] += timeFrame.overtime*4*5*durationMonthFormat(timeFrame.from,timeFrame.to)*0.95*ReferenceStaffWithPerformanceList(staff, performanceList);
                // timeFrame['mutipleCostString'] = '('+timeFrame.overtime+'*4*5'+'*'+durationMonthFormat(timeFrame.from,timeFrame.to)+'*0.95*'+staff.salary/152+')*2';
                // timeFrame['mutipleTimeString'] = timeFrame.overtime+'*4*5'+'*'+durationMonthFormat(timeFrame.from,timeFrame.to)+'*0.95*'+ReferenceStaffWithPerformanceList(staff, performanceList);
            }
            timeFrame['duration'] = durationMonthFormat(timeFrame.from,timeFrame.to);

            // console.log(chosenStaffsResult[staffIndex]);
            // console.log((timeFrame.overtime*durationMonthFormat(timeFrame.from,timeFrame.to)*0.95*(staff.salary/152))*2);
            // console.log(timeFrame.overtime*durationMonthFormat(timeFrame.from,timeFrame.to)*0.95*(staff.salary/152));
        }
        totalProjectCost+=staff['totalCost'];
    }
    return {
        suitableStaffs: chosenStaffs,
        totalProjectCost: totalProjectCost,
        totalTimeTeamAfforable: totalTimeTeamAfforable
    };
}

function caculateTimeOfLastStaff(lastStaff, extraTime, performanceList) {
    let timeOfDayForProject = _.cloneDeep(lastStaff.timeOfDayForProject);
    let typeWork = _.cloneDeep(lastStaff.typeWork);
    while(true) {
        if(checkTimeOfDayForProject(timeOfDayForProject, typeWork)) {
            return timeOfDayForProject;
        }
        for(let i = 0; i < timeOfDayForProject.length; i++) {
            if(lastStaff.typeWork === 'OFFICE') {
                timeOfDayForProject[i].office = timeOfDayForProject[i].office - 1;
                let minus = SumAvailableHour(lastStaff, performanceList, lastStaff.timeOfDayForProject, lastStaff.typeWork) - 
                                SumAvailableHour(lastStaff, performanceList, timeOfDayForProject, lastStaff.typeWork);
                if(minus === extraTime) {
                    return timeOfDayForProject;
                } else if (minus > extraTime) {
                    timeOfDayForProject[i].office = timeOfDayForProject[i].office + 1;
                    return timeOfDayForProject;
                }
            } else {
                timeOfDayForProject[i].overtime = timeOfDayForProject[i].overtime - 1;
                let minus = SumAvailableHour(lastStaff, performanceList, lastStaff.timeOfDayForProject, lastStaff.typeWork) - 
                                SumAvailableHour(lastStaff, performanceList, timeOfDayForProject, lastStaff.typeWork);
                if(minus === extraTime) {
                    return timeOfDayForProject;
                } else if (minus > extraTime) {
                    timeOfDayForProject[i].overtime = timeOfDayForProject[i].overtime + 1;
                    return timeOfDayForProject;
                }
            }
        }
    }
}

function checkTimeOfDayForProject(timeOfDayForProject, typeWork) {
    let flag = 0;
    for(let time of timeOfDayForProject) {
        if(typeWork === 'OFFICE') {
            flag += time.office;
        }
        else {
            flag += time.overtime;
        }
    }
    if(flag === timeOfDayForProject.length) {
        return true;
    }
    return false;
}

function SumTimeOfNStaffs(staffs, projectDuration, performanceList, projectWillCreate) {
    let sumTime = 0;

    for (let i = 0; i < staffs.length; i++) {
        // caculate timeline
        let timeline = generateTimeline(staffs[i], projectWillCreate);
        //caculate available time
        let arrayAvailableHour = combineAvailableHourToTimeline(staffs[i], timeline);

        sumTime += SumAvailableHour(staffs[i], performanceList, arrayAvailableHour, staffs[i].typeWork);
    }
    return sumTime;
}

function SumAvailableHour(staff, performanceList, arrayAvailableHour, typeWork) {
    let sum = 0;
    for (let avalableHour of arrayAvailableHour) {
        if (typeWork === 'OFFICE') {
            sum += avalableHour.office * 4 * 5 * 0.95 * durationMonthFormat(avalableHour.from, avalableHour.to) * ReferenceStaffWithPerformanceList(staff, performanceList);
        } else {
            sum += avalableHour.overtime * 4 * 5 * 0.95 * durationMonthFormat(avalableHour.from, avalableHour.to) * ReferenceStaffWithPerformanceList(staff, performanceList);
        }
    }
    return sum;
}

function durationMonthFormat(start, end) {
    var formatStart = moment(start,"DD/MM/YYYY HH:mm:ss");
    var formatEnd = moment(end,"DD/MM/YYYY HH:mm:ss");
    let difference = formatEnd.diff(formatStart, 'months', true);
    return difference;
}

function ReferenceStaffWithPerformanceList(staff, performanceList) {
    var keyAbility = `{ACAP: ${staff.analyst_capability}, PCAP: ${staff.programmer_capability}, APEX: ${staff.application_experience}, PLEX: ${staff.platform_experience}, LTEX: ${staff.language_and_toolset_experience}}`;
    return performanceList[keyAbility];
}


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
    return;
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
    // console.log('sortStaffsSalaryForOneHours',sortStaffsSalaryForOneHours);
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

router.post('/suitableStaff', (req, res) => {
    //console.log('================aaaaa');

    let requirement = req.body;

    User.find({
        analyst_capability: { $gte:  requirement.analyst_capability },
        programmer_capability: { $gte:  requirement.programmer_capability},
        application_experience: { $gte: requirement.application_experience },
        platform_experience: { $gte: requirement.platform_experience },
        language_and_toolset_experience: { $gte: requirement.language_and_toolset_experience }
    }, {
        password: false,
        salt: false
    })
    .populate('work_time.projects.project')
    .sort({
        salary: 1
    })
    // .limit(parseInt((requirement.person_month === undefined) ? 1 : requirement.person_month))
    // .limit(6)
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
            // var projectDuration = 3;
            // //var personMonth = 9.87;
            // var projectWillCreate = {
            //     start_day: new Date(2018,07,02),
            //     end_day: new Date(2018,11,02)
            // }

            // console.log(typeof requirement.start_day);

            var projectDuration = requirement.projectDuration;
            //var personMonth = 9.87;
            var projectWillCreate = {
                start_day: new Date(requirement.start_day),
                end_day: new Date(requirement.end_day)
            };
            console.log('satisfiedRequirementStaffs',satisfiedRequirementStaffs.length);
            let suitableStaffsInfos = CaculateStaff([...satisfiedRequirementStaffs], projectDuration, requirement.personMonths, requirement.performanceTable, projectWillCreate);
            // console.log('suitableStaffsInfos',suitableStaffsInfos);
            res.json({
                success: true,
                message: 'all suitable staff',
                suitableStaffs: suitableStaffsInfos.suitableStaffs,
                totalProjectCost: suitableStaffsInfos.totalProjectCost,
                totalTimeTeamAfforable: suitableStaffsInfos.totalTimeTeamAfforable
            }); 
        }
    });
});

router.post('/bruteforceStaff', (req, res) => {
    
    let requirement = req.body;
    //console.log(requirement);
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


// var projectWillCreate = {
//     start_day: new Date(2016,06,02),
//     end_day: new Date(2016,09,02)
// }

var staff = {
    work_time: {
        projects: [
            {
                _id: 3,
                office: 1,
                overtime: 1,
                start_day: new Date(2016,06,05),
                end_day: new Date(2016,10,02)
            },
            {
                _id: 2,
                office: 2,
                overtime: 1,
                start_day: new Date(2016,04,05),
                end_day: new Date(2016,07,05)
            },
            {
                _id: 1,
                office: 3,
                overtime: 1,
                start_day: new Date(2016,03,03),
                end_day: new Date(2016,06,03)
            },
            {
                _id: 4,
                office: 3,
                overtime: 1,
                start_day: new Date(2016,06,05),
                end_day: new Date(2016,08,05)
            }
        ]
    }
};


function generateTimeline(staff, projectWillCreate) {
    let timeline = [];
    timeline.push(projectWillCreate.start_day, projectWillCreate.end_day);
    for (let workingProject of staff.work_time.projects) {
        if (workingProject.project.start_day > projectWillCreate.start_day && workingProject.project.start_day < projectWillCreate.end_day) {
            // |2/7-----(2/9)--------------------2/10|-------(2/11)
            // |2/7-----(2/8)----------(2/9)----------2/10|
            if (workingProject.project.end_day < projectWillCreate.end_day) {
                //|2/7-----(2/8)----------(2/9)----------2/10|
                timeline.push(workingProject.start_day,workingProject.end_day);

                continue;
            }
            if (workingProject.project.end_day > projectWillCreate.end_day) {
                //|2/7-----(2/9)--------------------2/10|-------(2/11)
                timeline.push(workingProject.project.start_day);
                continue;
            }
            continue;
        }
        if (workingProject.project.start_day < projectWillCreate.start_day && workingProject.project.end_day > projectWillCreate.start_day) {
            // (2/3)--------|2/7--------(2/8)----------2/10|
            // (2/3)--------|2/7------------------2/10|-------(2/11)
            if (workingProject.project.end_day < projectWillCreate.end_day) {
                //(2/3)--------|2/7--------(2/8)----------2/10|
                timeline.push(workingProject.project.end_day);
            }
            continue;
        }
    }

    timeline
        .sort(function (a, b) {
            return a.getTime() < b.getTime() ? -1 : a.getTime() > b.getTime() ? 1 : 0;
        });
    // console.log(timeline);
    // console.log('===========================================');
    // console.log(convertMilisecondsToDate((convertDateToMiliseconds(timeline))));
    return convertMilisecondsToDate(_.uniq(convertDateToMiliseconds(timeline)));
}


function combineAvailableHourToTimeline(staff, timeline) {

    let availableHour = [];
    for (i = 0; i < timeline.length - 1; i++) {
        availableHour.push({
            from: timeline[i],
            to: timeline[i + 1],
            office: 8,
            overtime: 4
        });
    }

    for (i = 0; i < timeline.length - 1; i++) {
        var timelineStartDay = timeline[i];
        var timelineEndDay = timeline[i + 1];

        for (let workingProject of staff.work_time.projects) {
            if (workingProject.project.end_day > timelineStartDay && workingProject.project.start_day < timelineEndDay) {
                availableHour[i].office -= workingProject.office;
                availableHour[i].overtime -= workingProject.overtime;
            }

            if (availableHour[i].office < 0) {
                availableHour[i].office = 0;
            }

            if (availableHour[i].overtime < 0) {
                availableHour[i].overtime = 0;
            }
        }
    }
    // console.log('availableHour',availableHour);
    return availableHour;
}

function convertDateToMiliseconds(dateArray) {
    let result = [];
    for (i = 0; i < dateArray.length; i++) {
        result.push(dateArray[i].getTime());
    }
    return result;
}

function convertMilisecondsToDate(milisecondsArray) {
    let result = [];
    for (i = 0; i < milisecondsArray.length; i++) {
        result.push(new Date(milisecondsArray[i]));
    }
    return result;
}

//console.log(combineAvailableHourToTimeline(staff, generateTimeline(staff, projectWillCreate)));


module.exports = router;