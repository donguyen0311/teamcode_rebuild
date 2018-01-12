
const _ = require('lodash');
const TimelineHelper = require('./TimelineHelper');

module.exports = {
    staffOneHourOffice: function (staffs) {
    	let listStaffs = staffs.map(staff => staff._doc); // get only data info of user
	    
	    let staffsWithSalaryForOneHoursOffice = _.map(_.cloneDeep(listStaffs), (staff) => {
	        staff.salaryForOneHours = staff.salary / 152;
	        staff.typeWork = 'OFFICE';
	        return staff;
	    });
	    
	    return staffsWithSalaryForOneHoursOffice;
    },

    staffOneHourOvertime: function (staffs) {
    	let listStaffs = staffs.map(staff => staff._doc); // get only data info of user
	    
	    let staffsWithSalaryForOneHoursOverTime = _.map(_.cloneDeep(listStaffs), (staff) => {
	        staff.salaryForOneHours = (staff.salary / 152) * 2;
	        staff.typeWork = 'OVERTIME';
	        return staff;
	    });
	    
	    return staffsWithSalaryForOneHoursOverTime;
    },
    sortOfficeAndOvertimeAscending: function (staffOffice, staffOvertime){
    	let sortStaffsSalaryForOneHours = _.sortBy([
	        ...staffOffice,
	        ...staffOvertime
	    ], ['salaryForOneHours']);

	    return sortStaffsSalaryForOneHours;
    },
    staffsWithTimeline: function(staffs, projectWillCreate){
    	let staffsWithTimeline = _.map(staffs, (staff) => {
            let timeline = TimelineHelper.GenerateTimeline(staff, projectWillCreate);
            let arrayAvailableHour = TimelineHelper.CombineAvailableHourToTimeline(staff, timeline);
            staff['timeOfDayForProject'] = arrayAvailableHour;
            return staff;
        });
        return staffsWithTimeline;
    }
};
