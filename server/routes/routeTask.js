const express = require('express');
var router = express.Router();
const config = require('../config/default');
const helper = require('../helper');
const Task = require('../models/task');

// router.post('/create', (req, res) => {
//     var newTask = new Task({
//         task_name: req.body.task_name,
//         level: req.body.level,
//         status: req.body.status,
//         position: req.body.position,
//         description: req.body.description,
//         note: req.body.note,
//         project_id: req.body.project_id,
//         responsible_user: req.body.responsible_user,
//         created_by: req.body.created_by
//     });
//     newTask.save((err) => {
//         if (err) console.log(err);
//         return res.json({
//             success: true,
//             message: "Create task successful."
//         });
//     });
// });

router.get('/', (req, res) => {
    Task
        .find({})
        .populate({
            path: 'belong_project',
            select: 'project_name'
        })
        .populate({
            path: 'responsible_user',
            select: 'email image'
        })
        .populate({
            path: 'created_by',
            select: 'email image'
        })
        .exec((err, tasks) => {
            if (err) console.log(err);
            if (!tasks) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'all tasks info',
                tasks: tasks
            });
        });
});

router.get('/:id', (req, res) => {
    Task
        .findOne({
            _id: req.params.id
        })
        .populate({
            path: 'belong_project',
            select: 'project_name'
        })
        .populate({
            path: 'responsible_user',
            select: 'email image'
        })
        .populate({
            path: 'created_by',
            select: 'email image'
        })
        .exec((err, task) => {
            if (err) console.log(err);
            if (!task) {
                return res.json({
                    success: false,
                    message: 'Something wrong.'
                });
            }
            return res.json({
                success: true,
                message: 'Your task info',
                task: task
            });
        });
});

// router.get('/:task_name', (req, res) => {
//     Task
//         .findOne({
//             task_name: req.params.task_name
//         })
//         .populate({
//             path: 'belong_project',
//             select: 'project_name'
//         })
//         .populate({
//             path: 'responsible_user',
//             select: 'email image'
//         })
//         .populate({
//             path: 'created_by',
//             select: 'email image'
//         })
//         .exec((err, task) => {
//             if (err) console.log(err);
//             if (!task) {
//                 return res.json({
//                     success: false,
//                     message: 'Something wrong.'
//                 });
//             }
//             return res.json({
//                 success: true,
//                 message: 'Your task info',
//                 task: task
//             });
//         });
// });

router.post('/', (req, res) => {
    var newTask = new Task({
        task_name: req.body.task_name,
        level: req.body.level,
        status: req.body.status,
        position: req.body.position,
        description: req.body.description,
        note: req.body.note,
        belong_project: req.body.belong_project,
        responsible_user: req.body.responsible_user || [],
        created_by: req.body.created_by
    });
    newTask.save((err) => {
        if (err) console.log(err);
        return res.json({
            success: true,
            message: "Create task successful."
        });
    });
});

router.put('/:id', (req, res) => {
    Task.findByIdAndUpdate(req.params.id, {
        $set: {
            task_name: req.body.task_name,
            level: req.body.level,
            description: req.body.description,
            note: req.body.note,
            responsible_user: req.body.responsible_user,
            updateAt: new Date()
        }
    }, {
        new: true
    })
    .populate({
        path: 'belong_project',
        select: 'project_name'
    })
    .populate({
        path: 'responsible_user',
        select: 'email image'
    })
    .populate({
        path: 'created_by',
        select: 'email image'
    })
    .exec((err, task) => {
        if (err) console.log(err);
        if (!task) {
            return res.json({
                success: false,
                message: 'Update task failed.'
            });
        }
        return res.json({
            success: true,
            message: 'Update task successful.',
            task: task
        });
    });
});

router.delete('/:id', (req, res) => {
    Task.findByIdAndRemove(req.params.id, (err, task) => {
        if (err) console.log(err);
        if (!task) {
            return res.json({
                success: false,
                message: 'Delete task failed.'
            });
        }
        return res.json({
            success: true,
            message: 'Delete task successful.'
        });
    });
});

module.exports = router;