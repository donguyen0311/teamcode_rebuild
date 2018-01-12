const _ = require('lodash');

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

module.exports = {
    GenerateTimeline: function (staff, projectWillCreate) {
        let timeline = [];
        timeline.push(projectWillCreate.start_day, projectWillCreate.end_day);

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
    },

    CombineAvailableHourToTimeline: function (staff, timeline) {
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
};


