const express = require('express');
var router = express.Router();
const config = require('../config/default');
const helper = require('../helper');
const Company = require('../models/company');

router.get('/', (req, res) => {
    Company
        .find({})
        .populate({
            path: 'staff',
            select: 'email'
        })
        .populate({
            path: 'created_by',
            select: 'email'
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

router.get('/:id', (req, res) => {
    Company
        .findOne({
            _id: req.params.id
        })
        .populate({
            path: 'staff',
            select: 'email'
        })
        .populate({
            path: 'created_by',
            select: 'email'
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

router.get(':/company_name', (req, res) => {
    Company
        .findOne({
            company_name: req.params.company_name
        })
        .populate({
            path: 'staff',
            select: 'email'
        })
        .populate({
            path: 'created_by',
            select: 'email'
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
            staff: req.body.staff,
            updateAt: new Date()
        }
    }, {
        new: true
    })
    .populate({
        path: 'staff',
        select: 'email'
    })
    .populate({
        path: 'created_by',
        select: 'email'
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