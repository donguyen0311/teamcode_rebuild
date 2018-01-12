const express = require('express');
var router = express.Router();
const config = require('../config/default');
const helper = require('../helper');
const Company = require('../models/company');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// const TimelineHelper = require('../helper/TimelineHelper');
const StaffHelper = require('../helper/StaffHelper');

let upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, path.join(__dirname, '..', '..', 'client/assets/images'));
        },
        filename: (req, file, callback) => {
            //originalname is the uploaded file's name with extn
            callback(null, file.originalname);
        }
    })
});

router.get('/', (req, res) => {
    Company
        .find({})
        .populate({
            path: 'staff',
            select: 'email image username firstname lastname'
        })
        .populate({
            path: 'created_by',
            select: 'email image username firstname lastname'
        })
        .exec((err, companies) => {
            if (err) console.log(err);
            if (!companies) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'all companies info',
                companies: companies
            });
        });
});

router.get('/allStaffTimeline/:companyId', (req, res) => {
    // console.log(req.query);
    
    let projectWillCreate = {
        start_day: new Date(req.query.start_day),
        end_day: new Date(req.query.end_day)
    };

    User
        .find({
            current_company: req.params.companyId
            // current_company: '5a1bc4ef5671cd2fa8beb87f'
        })
        .exec((err, allStaffInCompany) => {
            if (err) console.log(err);
            if (!allStaffInCompany) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            
            let staffsWithSalaryForOneHoursOffice = StaffHelper.staffOneHourOffice(allStaffInCompany);
            let staffsWithSalaryForOneHoursOverTime = StaffHelper.staffOneHourOvertime(allStaffInCompany);
            let sortedStaffsSalary = StaffHelper.sortOfficeAndOvertimeAscending(staffsWithSalaryForOneHoursOffice,staffsWithSalaryForOneHoursOverTime);

            let staffsWithTimeline = StaffHelper.staffsWithTimeline(sortedStaffsSalary,projectWillCreate);

            return res.json({
                success: true,
                message: 'All staff with timeline in your company',
                staffsWithTimeline: staffsWithTimeline

            });
        });
});

router.get('/:id', (req, res) => {
    Company
        .findOne({
            _id: req.params.id
        })
        .populate({
            path: 'staff',
            select: 'email image username firstname lastname'
        })
        .populate({
            path: 'created_by',
            select: 'email image username firstname lastname'
        })
        .exec((err, company) => {
            if (err) console.log(err);
            if (!company) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'Your company info',
                company: company
            });
        });
});

// router.get('/:company_name', (req, res) => {
//     Company
//         .findOne({
//             company_name: req.params.company_name
//         })
//         .populate({
//             path: 'staff',
//             select: 'email image'
//         })
//         .populate({
//             path: 'created_by',
//             select: 'email image'
//         })
//         .exec((err, company) => {
//             if (err) console.log(err);
//             if (!company) {
//                 return res.json({
//                     success: false,
//                     message: 'Something wrong.'
//                 });
//             }
//             return res.json({
//                 success: true,
//                 message: 'Your company info',
//                 company: company
//             });
//         });
// });

router.post('/', (req, res) => {
    Company.findOne({
        company_name: req.body.company_name
    }, (err, company) => {
        if (err) console.log(err);
        if (company) {
            return res.json({
                success: false,
                message: 'Company name already exists.'
            });
        } else {
            var newCompany = new Company({
                company_name: req.body.company_name,
                address: req.body.address,
                description: req.body.description,
                field: req.body.field,
                created_by: req.body.created_by
            });
            newCompany.save((err) => {
                if (err) console.log(err);
                return res.json({
                    success: true,
                    message: "Create company successful."
                });
            });
        }
    });
});

router.put('/:id', (req, res) => {
    Company.findByIdAndUpdate(req.params.id, {
        $set: {
            address: req.body.address,
            description: req.body.description,
            field: req.body.field,
            updateAt: new Date()
        }
    }, {
        new: true
    })
    .populate({
        path: 'staff',
        select: 'email image username firstname lastname'
    })
    .populate({
        path: 'created_by',
        select: 'email image username firstname lastname'
    })
    .exec((err, company) => {
        if (err) console.log(err);
        if (!company) {
            return res.json({
                success: false,
                message: 'Update company failed.'
            });
        }
        return res.json({
            success: true,
            message: 'Update company successful.',
            company: company
        });
    });
});

router.put('/image/:id', upload.any(), async(req, res) => {
    var companyUpdated = await Company.findByIdAndUpdate(req.params.id, {
            $set: {
                image: `/assets/images/${req.files[0].filename}`
            }
        }, {
            new: true // return new user info
        })
        .exec();
    if (companyUpdated) {
        return res.json({
            success: true,
            message: "Upload Success",
            company: companyUpdated
        });
    }
    return res.json({
        success: false,
        message: "Upload Failed"
    });

});

router.delete('/:id', (req, res) => {
    Company.findByIdAndRemove(req.params.id, (err, company) => {
        if (err) console.log(err);
        if (!company) {
            return res.json({
                success: false,
                message: 'Delete company failed.'
            });
        }
        return res.json({
            success: true,
            message: 'Delete company successful.'
        });
    });
});

module.exports = router;