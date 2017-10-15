const express = require('express');
var router = express.Router();
const config = require('../config/default');
const helper = require('../helper');
const Project = require('../models/project');

router.get('/', (req, res) => {
    Project
        .find({})
        .populate('company')
        .populate({
            path: 'created_by',
            select: 'email'
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

router.get('/:id', (req, res) => {
    Project
        .findOne({
            _id: req.params.id
        })
        .populate('company')
        .populate({
            path: 'created_by',
            select: 'email'
        })
        .populate('tasks')
        .exec((err, project) => {
            if (err) console.log(err);
            if (!project) {
                return res.json({
                    success: false,
                    message: 'ID not found.'
                });
            }
            return res.json({
                success: true,
                message: 'Your project info',
                project: project
            });
        });

});

router.get('/:project_name', (req, res) => {
    Project
        .findOne({
            project_name: req.params.project_name
        })
        .populate('company')
        .populate({
            path: 'created_by',
            select: 'email'
        })
        .populate('tasks')
        .exec((err, project) => {
            if (err) console.log(err);
            if (!project) {
                return res.json({
                    success: false,
                    message: 'ID not found.'
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
                company: req.body.id_company,
                created_by: req.body.created_by
            });
            newProject.save((err) => {
                if (err) console.log(err);
                return res.json({
                    success: true,
                    message: "Create project successful."
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
            company: req.body.company,
            created_by: req.body.created_by,
            description: req.body.description,
            language_programming: req.body.language_programming,
            level: req.body.level,
            tasks: req.body.tasks, // Hmmm, maybe delete
            updateAt: new Date()
        }
    }, {
        new: true
    })
    .populate('company')
    .populate({
        path: 'created_by',
        select: 'email'
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