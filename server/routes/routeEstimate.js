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
const mongoose = require('mongoose');
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

  
function CaculateStaff(staffs, projectDuration, personMonths /*Effort*/, performanceList, projectWillCreate, prePickStaffsInfo=[]) {
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

    let listStaffsPrePick;
    let prePickStaffsWithSalaryForOneHoursOffice;
    if(prePickStaffsInfo.length > 0)
    {
        listStaffsPrePick = prePickStaffsInfo.map(prePickStaff => prePickStaff._doc); // get only data info of user

        prePickStaffsWithSalaryForOneHoursOffice = _.map(_.cloneDeep(listStaffsPrePick), (prePickStaff) => {
            prePickStaff.salaryForOneHours = prePickStaff.salary / 152;
            prePickStaff.typeWork = 'OFFICE';
            return prePickStaff;
        });
        // let prePickStaffsWithSalaryForOneHoursOverTime = _.map(_.cloneDeep(listStaffsPrePick), (prePickStaff) => {
        //     prePickStaff.salaryForOneHours = (prePickStaff.salary / 152) * 2;
        //     prePickStaff.typeWork = 'OVERTIME';
        //     return prePickStaff;
        // });
    }

    let sortStaffsSalaryForOneHours = _.sortBy([
        ...staffsWithSalaryForOneHoursOffice,
        ...staffsWithSalaryForOneHoursOverTime
    ], ['salaryForOneHours']);

    // filter staff work < 10% project duration
    let filterStaffs = FilterStaffSuitableTimeForProject(sortStaffsSalaryForOneHours, projectDuration, projectWillCreate);

    //pre pick mode is on
    if(prePickStaffsWithSalaryForOneHoursOffice !== undefined)
    {
        if(prePickStaffsWithSalaryForOneHoursOffice.length > 0)
        {
            //check afforable of all pre pick staff
            // console.log('prePickStaffsWithSalaryForOneHoursOffice',prePickStaffsWithSalaryForOneHoursOffice);
            let sumTimeOfNStaffs = SumTimeOfNStaffs(prePickStaffsWithSalaryForOneHoursOffice, projectDuration, performanceList, projectWillCreate);
            if (sumTimeOfNStaffs >= projectByHours) {
                // console.log('ENOUGH');
                let extraTime = sumTimeOfNStaffs - projectByHours;
                prePickStaffsWithSalaryForOneHoursOffice = _.map(prePickStaffsWithSalaryForOneHoursOffice, (staff) => {
                    // console.log('inside map',staff);
                    staff.monthSpend = projectDuration;
                    // caculate timeline
                    let timeline = GenerateTimeline(staff, projectWillCreate);
                    //caculate available time
                    let arrayAvailableHour = CombineAvailableHourToTimeline(staff, timeline);
                    staff.timeOfDayForProject = arrayAvailableHour;
                    return staff;
                });

                // caculate time of last staff
                // prePickStaffsWithSalaryForOneHoursOffice[iStaff].timeOfDayForProject = CaculateTimeOfLastStaff(prePickStaffsWithSalaryForOneHoursOffice[iStaff], extraTime, performanceList);

                let {suitableStaffs, totalProjectCost, totalTimeTeamAfforable} = CaculateSalaryBaseOnTimelineAndTotalProjectCost(prePickStaffsWithSalaryForOneHoursOffice, performanceList);

                // prePickStaffsWithSalaryForOneHoursOffice.map((staff) => console.log({typework: staff.typeWork, timeOfDayForProject: staff.timeOfDayForProject})); // delete soon

                return {suitableStaffs: suitableStaffs, totalProjectCost: totalProjectCost, totalTimeTeamAfforable: totalTimeTeamAfforable};
            }

            //pre pick staff still not afforable project
            for (let iStaff = 0; iStaff < filterStaffs.length; iStaff++) {

                let chosenStaffs = _.slice(filterStaffs, 0, iStaff + 1);
                let staffWillAdd = 
                // console.log(chosenStaffs);
                chosenStaffs = chosenStaffs.concat(prePickStaffsWithSalaryForOneHoursOffice);
                // console.log('---------------------------------------');
                // console.log(chosenStaffs);

                let sumTimeOfNStaffs = SumTimeOfNStaffs(chosenStaffs, projectDuration, performanceList, projectWillCreate);
                if (sumTimeOfNStaffs >= projectByHours) {
                    let extraTime = sumTimeOfNStaffs - projectByHours;
                    chosenStaffs = _.map(chosenStaffs, (staff) => {
                        staff.monthSpend = projectDuration;
                        // caculate timeline
                        let timeline = GenerateTimeline(staff, projectWillCreate);
                        //caculate available time
                        let arrayAvailableHour = CombineAvailableHourToTimeline(staff, timeline);
                        staff.timeOfDayForProject = arrayAvailableHour;
                        return staff;
                    });

                    // caculate time of last staff
                    chosenStaffs[iStaff].timeOfDayForProject = CaculateTimeOfLastStaff(chosenStaffs[iStaff], extraTime, performanceList);

                    let {suitableStaffs, totalProjectCost, totalTimeTeamAfforable} = CaculateSalaryBaseOnTimelineAndTotalProjectCost(chosenStaffs, performanceList);

                    // chosenStaffs.map((staff) => console.log({typework: staff.typeWork, timeOfDayForProject: staff.timeOfDayForProject})); // delete soon
                    // console.log('suitableStaffs',suitableStaffs);
                    return {suitableStaffs: suitableStaffs, totalProjectCost: totalProjectCost, totalTimeTeamAfforable: totalTimeTeamAfforable};
                }
            }
        }
    }
    else
    {
        for (let iStaff = 0; iStaff < filterStaffs.length; iStaff++) {

            let chosenStaffs = _.slice(filterStaffs, 0, iStaff + 1);

            let sumTimeOfNStaffs = SumTimeOfNStaffs(chosenStaffs, projectDuration, performanceList, projectWillCreate);
            if (sumTimeOfNStaffs >= projectByHours) {
                let extraTime = sumTimeOfNStaffs - projectByHours;
                chosenStaffs = _.map(chosenStaffs, (staff) => {
                    staff.monthSpend = projectDuration;
                    // caculate timeline
                    let timeline = GenerateTimeline(staff, projectWillCreate);
                    //caculate available time
                    let arrayAvailableHour = CombineAvailableHourToTimeline(staff, timeline);
                    staff.timeOfDayForProject = arrayAvailableHour;
                    return staff;
                });

                // caculate time of last staff
                chosenStaffs[iStaff].timeOfDayForProject = CaculateTimeOfLastStaff(chosenStaffs[iStaff], extraTime, performanceList);

                let {suitableStaffs, totalProjectCost, totalTimeTeamAfforable} = CaculateSalaryBaseOnTimelineAndTotalProjectCost(chosenStaffs, performanceList);

                // chosenStaffs.map((staff) => console.log({typework: staff.typeWork, timeOfDayForProject: staff.timeOfDayForProject})); // delete soon

                return {suitableStaffs: suitableStaffs, totalProjectCost: totalProjectCost, totalTimeTeamAfforable: totalTimeTeamAfforable};
            }
        }
    }
    return {suitableStaffs: [], totalProjectCost: 0, totalTimeTeamAfforable: 0};
}

function FilterStaffSuitableTimeForProject(staffs, projectDuration, projectWillCreate) {
    let staffsClone = _.cloneDeep(staffs);
    let filterStaffs = _.filter(staffsClone, (staff) => {
        // caculate timeline
        let timeline = GenerateTimeline(staff, projectWillCreate);
        // caculate available time
        let arrayAvailableHour = CombineAvailableHourToTimeline(staff, timeline);
        let sumAvailableHour = 0;
        if (staff.typeWork === 'OFFICE') {
            for (let availableHour of arrayAvailableHour) {
                if(availableHour.office > 0) {
                    sumAvailableHour += DurationMonthFormat(availableHour.from, availableHour.to);
                }
            }
            if ((sumAvailableHour / projectDuration) < 0.9) {
                return false;
            }
            return true;
        } else {
            for (let availableHour of arrayAvailableHour) {
                if(availableHour.overtime > 0) {
                    sumAvailableHour += DurationMonthFormat(availableHour.from, availableHour.to);
                }
            }
            if ((sumAvailableHour / projectDuration) < 0.9) {
                return false;
            }
            return true;
        }   
    });
    return filterStaffs;
}

function CaculateSalaryBaseOnTimelineAndTotalProjectCost(chosenStaffs, performanceList) {
    let totalProjectCost = 0;
    let totalTimeTeamAfforable = 0;
    for (let staff of chosenStaffs) {
        staff.totalCost = 0;
        staff.affordableTime = 0;
        for (let timeFrame of staff.timeOfDayForProject) {
            if (staff.typeWork === 'OFFICE') {
                staff.totalCost += timeFrame.office * 4 * 5 * DurationMonthFormat(timeFrame.from, timeFrame.to) * 0.95 * (staff.salary / 152);
                totalTimeTeamAfforable += timeFrame.office * 4 * 5 * DurationMonthFormat(timeFrame.from, timeFrame.to) * 0.95 * ReferenceStaffWithPerformanceList(staff, performanceList);
                staff.affordableTime += timeFrame.office * 4 * 5 * DurationMonthFormat(timeFrame.from, timeFrame.to) * 0.95 * ReferenceStaffWithPerformanceList(staff, performanceList);
            } else {
                staff.totalCost += (timeFrame.overtime * 4 * 5 * DurationMonthFormat(timeFrame.from, timeFrame.to) * 0.95 * (staff.salary / 152)) * 2;
                totalTimeTeamAfforable += timeFrame.overtime * 4 * 5 * DurationMonthFormat(timeFrame.from, timeFrame.to) * 0.95 * ReferenceStaffWithPerformanceList(staff, performanceList);;
                staff.affordableTime += timeFrame.overtime * 4 * 5 * DurationMonthFormat(timeFrame.from, timeFrame.to) * 0.95 * ReferenceStaffWithPerformanceList(staff, performanceList);
            }
            timeFrame.duration = DurationMonthFormat(timeFrame.from, timeFrame.to);
        }
        totalProjectCost += staff.totalCost;
    }
    return {
        suitableStaffs: chosenStaffs,
        totalProjectCost: totalProjectCost,
        totalTimeTeamAfforable: totalTimeTeamAfforable
    };
}

function CaculateTimeOfLastStaff(lastStaff, extraTime, performanceList) {
    let timeOfDayForProject = _.cloneDeep(lastStaff.timeOfDayForProject);
    let typeWork = _.cloneDeep(lastStaff.typeWork);
    while (true) {
        if (CheckTimeOfDayForProject(timeOfDayForProject, typeWork)) {
            return timeOfDayForProject;
        }
        for (let i = 0; i < timeOfDayForProject.length; i++) {
            if (lastStaff.typeWork === 'OFFICE') {
                timeOfDayForProject[i].office = timeOfDayForProject[i].office - 1;
                let minus = SumAvailableHour(lastStaff, performanceList, lastStaff.timeOfDayForProject, lastStaff.typeWork) -
                    SumAvailableHour(lastStaff, performanceList, timeOfDayForProject, lastStaff.typeWork);
                if (minus === extraTime) {
                    return timeOfDayForProject;
                } else if (minus > extraTime) {
                    timeOfDayForProject[i].office = timeOfDayForProject[i].office + 1;
                    return timeOfDayForProject;
                }
            } else {
                timeOfDayForProject[i].overtime = timeOfDayForProject[i].overtime - 1;
                let minus = SumAvailableHour(lastStaff, performanceList, lastStaff.timeOfDayForProject, lastStaff.typeWork) -
                    SumAvailableHour(lastStaff, performanceList, timeOfDayForProject, lastStaff.typeWork);
                if (minus === extraTime) {
                    return timeOfDayForProject;
                } else if (minus > extraTime) {
                    timeOfDayForProject[i].overtime = timeOfDayForProject[i].overtime + 1;
                    return timeOfDayForProject;
                }
            }
        }
    }
}

function getPrePickStaffInfos(prePickStaffsId, filterStaffs)
{
    console.log('prePickStaffsId',prePickStaffsId);
    let prePickStaffsInfo = [];

    for(let prePickStaffId of prePickStaffsId)
    {
        for(let filterStaff of filterStaffs)
        {
            if(prePickStaffId == filterStaff._id)
            {
                prePickStaffsInfo.push(filterStaff);
            }
        }
    }
    console.log('prePickStaffsInfo',prePickStaffsInfo);
    return prePickStaffsInfo;
}

function removeDuplicateWhenPrePickStaff(satisfiedRequirementStaffs, prePickStaffsInfo)
{
    for(let [prePickStaffInfoIndex, prePickStaffInfo] of prePickStaffsInfo.entries())
    {
        // console.log('prePickStaffInfoIndex',prePickStaffInfoIndex);
        for(let [satisfiedRequirementStaffIndex, satisfiedRequirementStaff] of satisfiedRequirementStaffs.entries())
        {
            // console.log('satisfiedRequirementStaffIndex',satisfiedRequirementStaffIndex);
            // console.log(prePickStaffInfo._id.toString()+'|||'+satisfiedRequirementStaff._id.toString());
            if(prePickStaffInfo._id.toString() === satisfiedRequirementStaff._id.toString())
            {
                // console.log('duplicate',satisfiedRequirementStaffIndex);
                satisfiedRequirementStaffs.splice(satisfiedRequirementStaffIndex,1);
            }
        }
    }
    // console.log('prePickStaffsInfo',prePickStaffsInfo);
    return satisfiedRequirementStaffs;
}

// check if staff have only 1 hour
function CheckTimeOfDayForProject(timeOfDayForProject, typeWork) {
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
        let timeline = GenerateTimeline(staffs[i], projectWillCreate);
        //caculate available time
        let arrayAvailableHour = CombineAvailableHourToTimeline(staffs[i], timeline);
        sumTime += SumAvailableHour(staffs[i], performanceList, arrayAvailableHour, staffs[i].typeWork);
    }
    return sumTime;
}

function SumAvailableHour(staff, performanceList, arrayAvailableHour, typeWork) {
    let sum = 0;
    for (let avalableHour of arrayAvailableHour) {
        if (typeWork === 'OFFICE') {
            sum += avalableHour.office * 4 * 5 * 0.95 * DurationMonthFormat(avalableHour.from, avalableHour.to) * ReferenceStaffWithPerformanceList(staff, performanceList);
        } else {
            sum += avalableHour.overtime * 4 * 5 * 0.95 * DurationMonthFormat(avalableHour.from, avalableHour.to) * ReferenceStaffWithPerformanceList(staff, performanceList);
        }
    }
    return sum;
}

function DurationMonthFormat(start, end) {
    var formatStart = moment(start,"DD/MM/YYYY HH:mm:ss");
    var formatEnd = moment(end,"DD/MM/YYYY HH:mm:ss");
    let difference = formatEnd.diff(formatStart, 'months', true);
    return difference;
}

function ReferenceStaffWithPerformanceList(staff, performanceList) {
    var keyAbility = `{ACAP: ${staff.analyst_capability}, PCAP: ${staff.programmer_capability}, APEX: ${staff.application_experience}, PLEX: ${staff.platform_experience}, LTEX: ${staff.language_and_toolset_experience}}`;
    return performanceList[keyAbility];
}

function GenerateTimeline(staff, projectWillCreate) {
    let timeline = [];
    timeline.push(projectWillCreate.start_day, projectWillCreate.end_day);
    // console.log('staff-------',staff);
    // console.log('staff-------',staff._id);
    // console.log('staff-------',staff.work_time);
    for (let workingProject of staff.work_time.projects) {
        if (workingProject.from > projectWillCreate.start_day && workingProject.from < projectWillCreate.end_day) {
            // |2/7-----(2/9)--------------------2/10|-------(2/11)
            // |2/7-----(2/8)----------(2/9)----------2/10|
            if (workingProject.to < projectWillCreate.end_day) {
                // |2/7-----(2/8)----------(2/9)----------2/10|
                // console.log('1',workingProject.from,workingProject.to);
                timeline.push(workingProject.from, workingProject.to);

                continue;
            }
            if (workingProject.to > projectWillCreate.end_day) {
                // |2/7-----(2/9)--------------------2/10|-------(2/11)
                // console.log('2',workingProject.from);
                timeline.push(workingProject.from);
                continue;
            }
            continue;
        }
        if (workingProject.from < projectWillCreate.start_day && workingProject.to > projectWillCreate.start_day) {
            // (2/3)--------|2/7--------(2/8)----------2/10|
            // (2/3)--------|2/7------------------2/10|-------(2/11)
            if (workingProject.to < projectWillCreate.end_day) {
                // (2/3)--------|2/7--------(2/8)----------2/10|
                // console.log('3',workingProject.to);
                timeline.push(workingProject.to);
            }
            continue;
        }
    }

    timeline
        .sort(function (a, b) {
            return a.getTime() < b.getTime()
                ? -1
                : a.getTime() > b.getTime()
                    ? 1
                    : 0;
        });
    return convertMilisecondsToDate(_.uniq(convertDateToMiliseconds(timeline)));
}

function CombineAvailableHourToTimeline(staff, timeline) {
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
            if (workingProject.to > timelineStartDay && workingProject.from < timelineEndDay) {
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

/*--------------brute force-----------------*/
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
/*--------------//brute force-----------------*/

router.post('/suitableStaff', (req, res) => {
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
        if (err) console.log(err);
        if (!satisfiedRequirementStaffs) {
            return res.json({
                success: false,
                message: 'Something wrong.'
            });
        } else {
            var projectDuration = requirement.projectDuration;
            var projectWillCreate = {
                start_day: new Date(requirement.start_day),
                end_day: new Date(requirement.end_day)
            };
            // console.log('satisfiedRequirementStaffs',satisfiedRequirementStaffs.length);
            let prePickStaffsId = requirement.prePickStaffsId;
            
            if(prePickStaffsId.length > 0)
            {
                User.find({
                '_id': { $in: prePickStaffsId}})
                .exec((err,prePickStaffsInfo) => {
                    if (err) console.log(err);
                    let satisfiedRequirementStaffsNotDuplicateWithPrePick = removeDuplicateWhenPrePickStaff(satisfiedRequirementStaffs,prePickStaffsInfo);

                    let suitableStaffsInfos = CaculateStaff([...satisfiedRequirementStaffsNotDuplicateWithPrePick], projectDuration, requirement.personMonths, requirement.performanceTable, projectWillCreate, prePickStaffsInfo);
                    res.json({
                        success: true,
                        message: 'all suitable staff',
                        suitableStaffs: suitableStaffsInfos.suitableStaffs,
                        totalProjectCost: suitableStaffsInfos.totalProjectCost,
                        totalTimeTeamAfforable: suitableStaffsInfos.totalTimeTeamAfforable
                    });
                });
            }
            else
            {
                let suitableStaffsInfos = CaculateStaff([...satisfiedRequirementStaffs], projectDuration, requirement.personMonths, requirement.performanceTable, projectWillCreate);
                res.json({
                    success: true,
                    message: 'all suitable staff',
                    suitableStaffs: suitableStaffsInfos.suitableStaffs,
                    totalProjectCost: suitableStaffsInfos.totalProjectCost,
                    totalTimeTeamAfforable: suitableStaffsInfos.totalTimeTeamAfforable
                });
            }
        }
    });
});

router.post('/bruteforceStaff', (req, res) => {
    let requirement = req.body;
    User.find({
            analyst_capability: {
                $gte: requirement.analyst_capability
            },
            programmer_capability: {
                $gte: requirement.programmer_capability
            },
            application_experience: {
                $gte: requirement.application_experience
            },
            platform_experience: {
                $gte: requirement.platform_experience
            },
            language_and_toolset_experience: {
                $gte: requirement.language_and_toolset_experience
            },
            belong_project: [],
            'work_time.office': {
                $ne: 8
            },
            'work_time.overtime': {
                $ne: 4
            }
        })
        .sort({
            salary: 1
        })
        .limit(parseInt(requirement.person_month))
        .exec((err, satisfiedRequirementStaffs) => {
            if (err) console.log(err);
            if (!satisfiedRequirementStaffs) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            } else {
                res.json({
                    success: true,
                    message: 'all suitable staff',
                    bruteforceStaffs: bruteforce(satisfiedRequirementStaffs, requirement.projectDuration, requirement.personMonths, requirement.performanceTable)
                });
            }
        });
});

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

module.exports = router;