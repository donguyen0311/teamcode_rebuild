const config = require('../config/default');
const socket = require('socket.io');
const path = require('path');
const Task = require('../models/task');

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
        

        socket.on('Task:changeTaskPosition', (data) => {
            //console.log(data.columns);
            data.columns[data.result.destination.droppableId].forEach(async (task, index) => {
                try {
                    await Task.findByIdAndUpdate(task._id, {
                            $set: {
                                position: index,
                                status: data.result.destination.droppableId,
                                updateAt: new Date()
                            }
                        },{
                            new: true
                        })
                        .exec();
                } catch(err) {
                    console.log('error caught');
                    console.log(err);
                }
            });
            data.columns[data.result.source.droppableId].forEach(async (task, index) => {
                try {
                    await Task.findByIdAndUpdate(task._id, {
                            $set: {
                                position: index,
                                status: data.result.source.droppableId,
                                updateAt: new Date()
                            }
                        },{
                            new: true
                        })
                        .exec();
                } catch(err) {
                    console.log('error caught');
                    console.log(err);
                }
            });
            socket.broadcast.emit('Task:updateTaskPosition', data.result);
        });
    });
};