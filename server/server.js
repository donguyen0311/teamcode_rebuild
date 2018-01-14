const express = require('express');
const app = express();
const config = require('./config/development');
const fs = require('fs');
const path = require('path');
const socket = require('socket.io');
const redis = require('socket.io-redis');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const ejs = require('ejs');
const subdomain = require('express-subdomain');
const routes = require('./routes');
const routesDocker = require('./routesDocker');

mongoose.connect(`mongodb://${encodeURIComponent(config.mongo.user)}:${encodeURIComponent(config.mongo.pass)}@${config.database_url}?authSource=${config.mongo.authSource}`, {
    useMongoClient: true
}).then(
    () => console.log('Connected Database'),
    err => {
        throw err;
    }
);
function shouldCompress(req, res) {
    if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false;
    }

    // fallback to standard filter function
    return compression.filter(req, res);
}


app.set('secretKey', config.secret_key);

app.set('views', path.join(__dirname, '../client_teamcode/build'));
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

app.use(helmet());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());
app.use(logger('dev'));

app.use(compression({filter: shouldCompress}));

app.use('/assets', express.static(path.join(__dirname, '../client/assets')));
app.use('/app', express.static(path.join(__dirname, '../client/app')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
app.use('/libs', express.static(path.join(__dirname, '../client/libs')));
app.use('/bundles', express.static(path.join(__dirname, '../client/bundles')));
app.use('/api', routes);

// for react client
app.use(express.static(path.join(__dirname, '../client_teamcode/build')));



// app.use(subdomain('*', routesDocker));

app.get('/', (req, res) => {
    return res.render('index');
});

var server = app.listen(config.port, config.hostname, () => {
    console.log(`Listening on ${config.hostname}:${config.port}`);
});

// socket route
const io = socket.listen(server);
//io.adapter(redis({ host: 'localhost', port: 6379 }));
require('./routes/routeSocket')(io);


app.get('/:company', (req, res) => {
    var nsp;
    if (Object.keys(io.nsps).indexOf(`/${req.params.company}`) === -1) {
        nsp = io.of(`/${req.params.company}`);
    }
    else {
        nsp = io.nsps[`/${req.params.company}`];
    }
    nsp.on('connection', function(socket){
        console.log('someone connected');
        nsp.emit('hi', req.params.company);
    });
    // res.send(req.params.company);
    res.render('demo.html', {namespace: req.params.company}, (err, html) => {
        return res.send(html);
    });
});
