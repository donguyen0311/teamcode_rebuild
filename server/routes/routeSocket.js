const config = require('../config/default');
const socket = require('socket.io');
const path = require('path');
const Task = require('../models/task');
const Project = require('../models/project');

module.exports = (io) => {
    //setting socket
    io.on('connection', function (socket) {
        console.log('a new username connected');

        //on user disconected
        socket.on('disconnect', function () {
            console.log('a user disconnected');
        });

        // socket.on('Task:changeTaskInfomation', (data) => {
        //     try {
        //         await Task.findByIdAndUpdate(data._id, {
        //                 $set: {
        //                     task_name: data.task_name,
        //                     level: data.level,
        //                     description: data.description,
        //                     note: data.note,
        //                     responsible_user: data.responsible_user || [],
        //                     updateAt: new Date()
        //                 }
        //             },{
        //                 new: true
        //             })
        //             .exec();
        //     } catch(err) {
        //         console.log('error caught');
        //         console.log(err);
        //     }
        //     socket.broadcast.emit('Task:updateTaskInfomation', data);
        // });

        socket.on('Task:joinRoom', (data) => {
            let rooms = Object.keys(socket.rooms);
            for (let room of rooms) {
                socket.leave(room);
            }
            socket.join(data);
        });

        socket.on('Task:addTask', async(data) => {
            console.log(data);
            var newTask = new Task({
                position: data.position,
                status: data.status,
                task_name: data.task_name,
                level: data.level,
                note: data.note,
                description: data.description,
                responsible_user: data.responsible_user,
                belong_project: data.belong_project,
                created_by: data.created_by
            });
            var createdTask = await newTask.save();
            if (createdTask) {
                var createdTaskMoreInfo = await Task
                    .findById(createdTask._id)
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
                    }).exec();
                var room = Object.keys(socket.rooms)[0];
                io.to(room).emit('Task:updateAddTask', createdTaskMoreInfo);
                var project = await Project.findById(data.belong_project);
                project.tasks.push(createdTask._id);
                project.save();
            }
        })

        socket.on('Task:changeTaskPosition', (data) => {
            //console.log(data.columns);
            data.columns[data.result.destination.droppableId].forEach(async(task, index) => {
                try {
                    await Task.findByIdAndUpdate(task._id, {
                            $set: {
                                position: index,
                                status: data.result.destination.droppableId,
                                updateAt: new Date()
                            }
                        }, {
                            new: true
                        })
                        .exec();
                } catch (err) {
                    console.log('error caught');
                    console.log(err);
                }
            });
            data.columns[data.result.source.droppableId].forEach(async(task, index) => {
                try {
                    await Task.findByIdAndUpdate(task._id, {
                            $set: {
                                position: index,
                                status: data.result.source.droppableId,
                                updateAt: new Date()
                            }
                        }, {
                            new: true
                        })
                        .exec();
                } catch (err) {
                    console.log('error caught');
                    console.log(err);
                }
            });
            var room = Object.keys(socket.rooms)[0];
            socket.to(room).broadcast.emit('Task:updateTaskPosition', data.result);
        });
    });
};