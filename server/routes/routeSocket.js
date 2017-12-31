const config = require('../config/default');
const socket = require('socket.io');
const path = require('path');
const Task = require('../models/task');
const Project = require('../models/project');
const Notification = require('../models/notification');
const Activity = require('../models/activity');
const User = require('../models/user');
const _ = require('lodash');

const taskStatus = {
    'TODO': 'To Do',
    'INPROGRESS': 'In Progress',
    'CODEREVIEW': 'Code Review',
    'DONE': 'Done'
}

function arr_diff(a1, a2) {

    var a = [],
        diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }

    return diff;
}

module.exports = (io) => {

    const userOnlineList = [];

    //setting socket
    io.on('connection', function (socket) {
        console.log('a new username connected');

        //on user disconected
        socket.on('disconnect', function () {
            console.log('a user disconnected');
            var index = _.findIndex(userOnlineList, {
                id: socket.id,
                userID: socket.userID
            });
            userOnlineList.splice(index, 1);
        });

        socket.on('updateOnlineList', (_id) => {
            socket.userID = _id;
            if (_.findIndex(userOnlineList, {
                    id: socket.id,
                    userID: socket.userID
                }) === -1) {
                userOnlineList.push(socket);
            }
        });

        socket.on('Task:joinRoom', (data) => {
            let rooms = Object.keys(socket.rooms);
            if (rooms.length > 1) {
                for (let i = 1; i < rooms.length; i++) {
                    socket.leave(rooms[i], () => {
                        socket.join(data);
                    });
                }
            } else {
                socket.join(data);
            }

        });

        socket.on('Task:addTask', async(data) => {
            console.log(userOnlineList);
            console.log(data);
            var newTask = new Task({
                position: data.position,
                status: data.status,
                task_name: data.task_name,
                level: data.level,
                note: data.note,
                labels: data.labels,
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
                        select: 'email image username firstname lastname'
                    })
                    .populate({
                        path: 'created_by',
                        select: 'email image username firstname lastname'
                    }).exec();
                var room = Object.keys(socket.rooms)[1];
                io.to(room).emit('Task:updateAddTask', createdTaskMoreInfo);

                var newActivity = new Activity({
                    action: `${createdTaskMoreInfo.created_by.username} created a new Task (${createdTaskMoreInfo.task_name})`,
                    belong_project: createdTaskMoreInfo.belong_project._id,
                    belong_user: createdTaskMoreInfo.created_by._id
                });
                var createdActivity = await newActivity.save();
                if (createdActivity) {
                    var createdActivityMoreInfo = await Activity
                        .findById(createdActivity._id)
                        .populate({
                            path: 'belong_user',
                            select: 'email image username firstname lastname'
                        }).exec();
                    io.to( room.replace('project', 'activity') ).emit('Activity:updateActivity', createdActivityMoreInfo);   
                }
                // add notification
                for (let responsible_user of data.responsible_user) {
                    let newNotification = new Notification({
                        title: `From project ${createdTaskMoreInfo.belong_project.project_name}`,
                        content: `You have assigned a new Task (${data.task_name}) by ${createdTaskMoreInfo.created_by.username}`,
                        status: 0,
                        belong_user: responsible_user,
                        link: `${createdTaskMoreInfo.belong_project.project_name}`
                    });
                    var createdNotification = await newNotification.save();
                    for (let userOnline of userOnlineList) {
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
            console.log(userOnlineList.map(user => ({
                id: user.id,
                userID: user.userID
            })));
            var previousTask = await Task.findById(data._id);
            var previousResponseUser = [...previousTask._doc.responsible_user];
            var currentResponseUser = [...data.editResponsible];
            var diffResponseUser = arr_diff(currentResponseUser, previousResponseUser);
            var updatedTask = await Task.findByIdAndUpdate(data._id, {
                    $set: {
                        task_name: data.editTaskName,
                        level: data.editLevel,
                        note: data.editNote,
                        labels: data.editLabels,
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
                    select: 'email image username firstname lastname'
                })
                .populate({
                    path: 'created_by',
                    select: 'email image username firstname lastname'
                })
                .exec();
            var room = Object.keys(socket.rooms)[1];
            io.to(room).emit('Task:updateEditTask', updatedTask);

            var user = await User.findById(socket.userID);
            var newActivity = new Activity({
                action: `${user.username} updated a Task (${data.editTaskName})`,
                belong_project: updatedTask.belong_project._id,
                belong_user: socket.userID
            });
            var createdActivity = await newActivity.save();
            if (createdActivity) {
                var createdActivityMoreInfo = await Activity
                    .findById(createdActivity._id)
                    .populate({
                        path: 'belong_user',
                        select: 'email image username firstname lastname'
                    }).exec();
                io.to( room.replace('project', 'activity') ).emit('Activity:updateActivity', createdActivityMoreInfo);   
            }

            // add notification
            for (let responsible_user of data.editResponsible) {
                if(_.indexOf(diffResponseUser, responsible_user) !== -1) {
                    let newNotification = new Notification({
                        title: `From project ${updatedTask.belong_project.project_name}`,
                        content: `You have assigned a Task (${updatedTask.task_name}) by ${user.username}`,
                        status: 0,
                        belong_user: responsible_user,
                        link: `${updatedTask.belong_project.project_name}`
                    });
                    let createdNotification = await newNotification.save();
                    for (let userOnline of userOnlineList) {
                        if (userOnline.userID === responsible_user) {
                            io.to(userOnline.id).emit('Notification:updateNotification', createdNotification);
                        }
                    }
                } else {
                    let newNotification = new Notification({
                        title: `From project ${updatedTask.belong_project.project_name}`,
                        content: `Your task handling (${updatedTask.task_name}) edited by ${user.username}`,
                        status: 0,
                        belong_user: responsible_user,
                        link: `${updatedTask.belong_project.project_name}`
                    });
                    let createdNotification = await newNotification.save();
                    for (let userOnline of userOnlineList) {
                        if (userOnline.userID === responsible_user) {
                            io.to(userOnline.id).emit('Notification:updateNotification', createdNotification);
                        }
                    }
                }
            }

        });

        socket.on('Task:deleteTask', async (data) => {
            console.log('data: ', data);
            var deletedTask = await Task.findByIdAndRemove(data._id)
                .populate({
                    path: 'belong_project',
                    select: 'project_name'
                })
                .populate({
                    path: 'created_by',
                    select: 'email image username firstname lastname'
                })
                .exec();
            console.log('deletedTask: ', deletedTask);
            if (deletedTask) {
                var room = Object.keys(socket.rooms)[1];
                io.to(room).emit('Task:updateDeleteTask', deletedTask);
            }

            var user = await User.findById(socket.userID);
            if(user) {
                var newActivity = new Activity({
                    action: `${user.username} deleted a Task (${deletedTask.task_name})`,
                    belong_project: deletedTask.belong_project,
                    belong_user: socket.userID
                });
                var createdActivity = await newActivity.save();
                if (createdActivity) {
                    var createdActivityMoreInfo = await Activity
                        .findById(createdActivity._id)
                        .populate({
                            path: 'belong_user',
                            select: 'email image username firstname lastname'
                        }).exec();
                    io.to( room.replace('project', 'activity') ).emit('Activity:updateActivity', createdActivityMoreInfo);
                }
            }
            // add notification
            let responsibleUser = [...deletedTask._doc.responsible_user];
            console.log('responsibleUser: ', responsibleUser);
            for (let responsible_user of responsibleUser) {
                let newNotification = new Notification({
                    title: `From project ${deletedTask.belong_project.project_name}`,
                    content: `Your task handling (${deletedTask.task_name}) deleted by ${user.username}`,
                    status: 0,
                    belong_user: responsible_user,
                    link: `${deletedTask.belong_project.project_name}`
                });
                let createdNotification = await newNotification.save();
                for (let userOnline of userOnlineList) {
                    if (userOnline.userID === responsible_user.toString()) {
                        io.to(userOnline.id).emit('Notification:updateNotification', createdNotification);
                    }
                }
            }
        });

        socket.on('Task:changeTaskPosition', async (data) => {
            console.log(userOnlineList.map(user => ({
                id: user.id,
                userID: user.userID
            })));
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

            var user = await User.findById(socket.userID);
            var task = await Task.findById(data.result.draggableId);

            if(user && task) {
                var newActivity = new Activity({
                    action: `${user.username} changed position a Task (${task.task_name}) from ${taskStatus[data.result.source.droppableId]} to ${taskStatus[data.result.destination.droppableId]}`,
                    belong_project: data.projectID,
                    belong_user: socket.userID
                });
                var createdActivity = await newActivity.save();
                if (createdActivity) {
                    var createdActivityMoreInfo = await Activity
                        .findById(createdActivity._id)
                        .populate({
                            path: 'belong_user',
                            select: 'email image username firstname lastname'
                        }).exec();
                    io.to( room.replace('project', 'activity') ).emit('Activity:updateActivity', createdActivityMoreInfo);
                }
            }
        });
    });
};