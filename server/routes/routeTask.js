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

module.exports = router;