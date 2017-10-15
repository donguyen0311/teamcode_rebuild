const config = require('../config/default');
const socket = require('socket.io');
const path = require('path');

module.exports = (io) => {
    //setting socket
    io.on('connection', function (socket) {
        console.log('a new username connected');

        //on user disconected
        socket.on('disconnect', function () {
            console.log('a user disconnected');
        });

    });
};