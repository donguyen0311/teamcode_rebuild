const proxy = require('express-http-proxy');
const express = require('express');
var routerDocker = express.Router();
const config = require('./config/default');


function getHosts(req, res) {
    console.log(req.subdomains);
    var data = {
        dev: 4900,
        database: 4901
    };
    var temp = req.subdomains[0];
    return 'http://192.168.1.115:' + data[temp];
}

routerDocker.all('*', proxy(getHosts));

module.exports = routerDocker;