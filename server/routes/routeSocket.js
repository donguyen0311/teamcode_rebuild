const config = require('../config/default');
const socket = require('socket.io');
const path = require('path');
const Task = require('../models/task');
const Project = require('../models/project');
const Notification = require('../models/notification');
const _ = require('lodash');


module.exports = (io) => {

    const userOnlineList = [];

    //setting socket
    io.on('connection', function (socket) {
        console.log('a new username connected');

        //on user disconected
        socket.on('disconnect', function () {
            console.log('a user disconnected');
            var index = _.findIndex(userOnlineList, { id: socket.id, userID: socket.userID });
            userOnlineList.splice(index, 1);
        });

        socket.on('updateOnlineList', (_id) => {
            socket.userID = _id;
            if (_.findIndex(userOnlineList, { id: socket.id, userID: socket.userID }) === -1) {
                userOnlineList.push(socket);
            }         
        });

        socket.on('Task:joinRoom', (data) => {
            let rooms = Object.keys(socket.rooms);
            if(rooms.length > 1) {
                for(let i = 1; i < rooms.length; i++) {
                    socket.leave(rooms[i], () => {
                        socket.join(data);  
                    });
                }
            }
            else {
                socket.join(data); 
            }
            
        });

        socket.on('Task:addTask', async (data) => {
            console.log(userOnlineList);
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
                        select: 'email username image'
                    })
                    .populate({
                        path: 'created_by',
                        select: 'email username image'
                    }).exec();
                var room = Object.keys(socket.rooms)[1];
                io.to(room).emit('Task:updateAddTask', createdTaskMoreInfo);

                // add notification
                for(let responsible_user of data.responsible_user) {
                    let newNotification = new Notification({
                        title: `From project ${createdTaskMoreInfo.belong_project.project_name}`,
                        content: `You have assigned a new Task (${data.task_name}) by ${createdTaskMoreInfo.created_by.username}`,
                        status: 0,
                        belong_user: responsible_user
                    }); 
                    var createdNotification = await newNotification.save();
                    for(let userOnline of userOnlineList) {
                        if (userOnline.userID === responsible_user) {
                            io.to(userOnline.id).emit('Notification:updateNotification', createdNotification);
                        }
                    }
                }

                // update project task
                var project = await Project.findById(data.belong_project);
                project.tasks.push(createdTask._id);
                project.save();
            }
        });

        socket.on('Task:editTask', async (data) => {
            console.log(data);
            console.log(userOnlineList.map(user => ({id: user.id, userID: user.userID})));
            // var currentTask = await Task.findById(data._id).populate({
            //         path: 'belong_project',
            //         select: 'project_name'
            //     })
            //     .populate({
            //         path: 'responsible_user',
            //         select: 'email image'
            //     })
            //     .populate({
            //         path: 'created_by',
            //         select: 'email username image'
            //     })
            //     .exec();
            var updatedTask = await Task.findByIdAndUpdate(data._id, {
                    $set: {
                        task_name: data.editTaskName,
                        level: data.editLevel,
                        note: data.editNote,
                        description: data.editDescription,
                        responsible_user: data.editResponsible,
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
                    select: 'email username image'
                })
                .exec();
            var room = Object.keys(socket.rooms)[1];
            io.to(room).emit('Task:updateEditTask', updatedTask);

            // add notification
            for(let responsible_user of data.editResponsible) {
                let newNotification = new Notification({
                    title: `From project ${updatedTask.belong_project.project_name}`,
                    content: `You have assigned a Task (${updatedTask.task_name}) by ${updatedTask.created_by.username}`,
                    status: 0,
                    belong_user: responsible_user
                }); 
                var createdNotification = await newNotification.save();
                for(let userOnline of userOnlineList) {
                    if (userOnline.userID === responsible_user) {
                        io.to(userOnline.id).emit('Notification:updateNotification', createdNotification);
                    }
                }
            }

        });

        socket.on('Task:deleteTask', async (data) => {
            console.log(data);
            var deletedTask = await Task.findByIdAndRemove(data._id).exec();
            console.log(deletedTask);
            var room = Object.keys(socket.rooms)[1];
            io.to(room).emit('Task:updateDeleteTask', deletedTask);
        });

        socket.on('Task:changeTaskPosition', (data) => {
            console.log(userOnlineList.map(user => ({id: user.id, userID: user.userID})));
            console.log(socket.id);
            // console.log(socket.rooms);
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
            var room = Object.keys(socket.rooms)[1];
            socket.to(room).broadcast.emit('Task:updateTaskPosition', data.result);
        });
    });
};