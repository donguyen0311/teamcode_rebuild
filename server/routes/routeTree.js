const express = require('express');
var router = express.Router();
const config = require('../config/default');
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
    res.json({
        message: 'Welcome to API tree'
    });
});

router.get('/all', (req, res) => {
    var _path;
    if (req.query.id == 1) {
        // _path = path.resolve(__dirname, '..', 'donguyen@gmail.com');
        _path = path.join('C:\\Users\\User\\Downloads\\Desktop\\file_explorer\\teamcode\\', "");
        processReq(_path, res);

    } else {
        if (req.query.id) {
            _path = decodeBase64(req.query.id);
            _path = path.join('C:\\Users\\User\\Downloads\\Desktop\\file_explorer\\teamcode\\', _path);
            processReq(_path, res);
        } else {
            res.json(['No valid data found']);
        }
    }
});

/* Serve a Resource */
router.get('/resource', function (req, res) {
    res.send(fs.readFileSync(path.join('C:\\Users\\User\\Downloads\\Desktop\\file_explorer\\teamcode\\', decodeBase64(req.query.resource)), 'UTF-8'));
});

function encodeBase64(text) {
    return new Buffer(text).toString('base64');
}

function decodeBase64(text) {
    return new Buffer(text, 'base64').toString('ascii');
}

function processReq(_path, res) {
    if (fs.statSync(_path).isDirectory()) {
        var resp = [];
        fs.readdir(_path, function (err, list) {
            for (var i = 0; i <= list.length - 1; i++) {
                resp.push(processNode(_path, list[i]));
            }
            res.json(resp);
        });
    }
    else {
        res.status(200).send('OK');
    }
}

function processNode(_path, f) {
    var s = fs.statSync(path.join(_path, f));
    return {
        "id": encodeBase64(path.join(_path, f).replace('C:\\Users\\User\\Downloads\\Desktop\\file_explorer\\teamcode\\', "")),
        "text": f,
        "icon": s.isDirectory() ? 'jstree-folder' : 'jstree-file',
        "state": {
            "opened": false,
            "disabled": false,
            "selected": false
        },
        "li_attr": {
            "base": encodeBase64(path.join(_path, f).replace('C:\\Users\\User\\Downloads\\Desktop\\file_explorer\\teamcode\\', "")),
            "isLeaf": !s.isDirectory()
        },
        "children": s.isDirectory(),
        "type": s.isDirectory() ? 'folder' : 'file'
    };
}

module.exports = router;