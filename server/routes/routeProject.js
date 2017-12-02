const express = require('express');
var router = express.Router();
const config = require('../config/default');
const helper = require('../helper');
const Project = require('../models/project');
const User = require('../models/user');

router.get('/', (req, res) => {
    Project
        .find({})
        .populate('belong_company')
        .populate({
            path: 'created_by',
            select: 'email image'
        })
        .populate('tasks')
        .exec((err, projects) => {
            if (err) console.log(err);
            if (!projects) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'all projects info',
                projects: projects
            });
        });
});

// router.get('/:id', (req, res) => {
//     Project
//         .findOne({
//             _id: req.params.id
//         })
//         .populate('belong_company')
//         .populate({
//             path: 'created_by',
//             select: 'email'
//         })
//         .populate('tasks')
//         .exec((err, project) => {
//             if (err) console.log(err);
//             if (!project) {
//                 return res.json({
//                     success: false,
//                     message: 'ID not found.'
//                 });
//             }
//             return res.json({
//                 success: true,
//                 message: 'Your project info',
//                 project: project
//             });
//         });

// });

router.get('/:project_name', (req, res) => {
    Project
        .findOne({
            project_name: req.params.project_name
        })
        .populate('belong_company')
        .populate({
            path: 'created_by',
            select: 'email image'
        })
        .populate({
            path: 'users',
            select: 'email image'
        })
        .populate({
            path: 'tasks',
            populate: {
                path: 'belong_project',
                select: 'project_name'
            },     
        })
        .populate({
            path: 'tasks',
            populate: {
                path: 'responsible_user',
                select: 'email image'
            },     
        })
        .populate({
            path: 'tasks',
            populate: {
                path: 'created_by',
                select: 'email image'
            },     
        })
        .exec((err, project) => {
            if (err) console.log(err);
            if (!project) {
                return res.json({
                    success: false,
                    message: 'Project name not found.'
                });
            }
            return res.json({
                success: true,
                message: 'Your project info',
                project: project
            });
        });
});

router.post("/", (req, res) => {
    Project.findOne({
        project_name: req.body.project_name
    }, (err, project) => {
        if (err) console.log(err);
        if (project) {
            return res.json({
                success: false,
                message: 'Project name already exists.'
            });
        } else {
            var newProject = new Project({
                project_name: req.body.project_name,
                budget: req.body.budget,
                deadline: req.body.deadline,
                description: req.body.description,
                language_programming: req.body.language_programming,
                level: req.body.level,
                belong_company: req.body.belong_company,
                created_by: req.body.created_by,
                users: req.body.users
            });

            newProject.save((err,projectSaved) => {
                if (err){
                  console.log(err);  
                  return res.json({
                        success: false,
                        message: err.message
                    });
                } 
                
                for (let index in projectSaved.users){
                    User.findByIdAndUpdate(
                        projectSaved.users[index]
                    ,
                    {
                        $push:{
                            belong_project: projectSaved._id
                        }
                    },(err,tank)=>{
                        if(err) console.log(err.message)
                    });
                }

                return res.json({
                    success: true,
                    message: "Create project successful.",
                    projectSaved: projectSaved
                });
            });
        }
    });
});

router.put("/:id", (req, res) => {
    Project.findByIdAndUpdate(req.params.id, {
        $set: {
            project_name: req.body.project_name,
            budget: req.body.budget,
            deadline: req.body.deadline,
            belong_company: req.body.belong_company,
            created_by: req.body.created_by,
            description: req.body.description,
            language_programming: req.body.language_programming,
            level: req.body.level,
            updateAt: new Date()
        }
    }, {
        new: true
    })
    .populate('belong_company')
    .populate({
        path: 'created_by',
        select: 'email image'
    })
    .populate('tasks')
    .exec((err, project) => {
        if (err) console.log(err);
        if (!project) {
            return res.json({
                success: false,
                message: 'Update project failed.'
            });
        }
        return res.json({
            success: true,
            message: 'Update project successful.',
            project: project
        });
    });
});

router.delete('/:id', (req, res) => {
    Project.findByIdAndRemove(req.params.id, (err, project) => {
        if (err) console.log(err);
        if (!project) {
            return res.json({
                success: false,
                message: 'Delete project failed.'
            });
        }
        return res.json({
            success: true,
            message: 'Delete project successful.'
        });
    });
});


module.exports = router;