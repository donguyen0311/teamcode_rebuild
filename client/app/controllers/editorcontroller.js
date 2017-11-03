(function(){
    'use strict';

    angular
        .module('app.controllers.editorcontroller', [])
        .controller('editorController', editorController);

    /** @ngInject */
    function editorController($scope){
        var vm = this;
        
        init();

        function init(){
        }

        $scope.coreConfig = {
            'check_callback': function (o, n, p, i, m) {
                if (m && m.dnd && m.pos !== 'i') {
                    return false;
                }
                if (o === "move_node" || o === "copy_node") {
                    if (this.get_node(n).parent === this.get_node(p).id) {
                        return false;
                    }
                }
                return true;
            },
            'themes': {
                'responsive': true
            }
        };
        $scope.typesConfig = {
            "default": {
                "icon": "folder"
            },
            "file": {
                'valid_children': [],
                "icon": "file"
            },
            "folder": {
                "icon": "folder"
            }
        };
        $scope.contextMenuAction = function (node) {
            console.log(node);
            var tmp = $.jstree.defaults.contextmenu.items();
            delete tmp.create.action;
            tmp.create.label = "New";
            tmp.create.submenu = {
                "Folder": {
                    "separator_after": true,
                    "label": "Folder",
                    "action": function (data) {
                        var inst = $.jstree.reference(data.reference),
                            obj = inst.get_node(data.reference);
                        inst.create_node(obj, {
                            type: "folder",
                            icon: 'jstree-folder'
                        }, "last", function (new_node, a, b) {
                            console.log(new_node, a, b);
                            setTimeout(function () {
                                inst.edit(new_node);
                            }, 0);
                        });
                    }
                },
                "File": {
                    "label": "File",
                    "action": function (data) {
                        var inst = $.jstree.reference(data.reference),
                            obj = inst.get_node(data.reference);
                        inst.create_node(obj, {
                            type: "file",
                            icon: 'jstree-file',
                            li_attr: {isLeaf: true}
                        }, "last", function (new_node) {
                            setTimeout(function () {
                                inst.edit(new_node);
                            }, 0);
                        });
                    }
                }
            };
            // Refresh
            tmp.refresh = {};
            tmp.refresh.label = "Refresh";
            tmp.refresh.action = function (data) {
                var inst = $.jstree.reference(data.reference),
                    node = inst.get_node(data.reference);
                inst.refresh_node(node);
            };
            //download
            tmp.downloadFolder = {};
            tmp.downloadFolder.label = "Download";
            tmp.downloadFolder.action = function (data) {
                var inst = $.jstree.reference(data.reference),
                    node = inst.get_node(data.reference);
                var url = node.id;
                var name = node.text;
                console.log(node);
                $http({
                    url: 'api/action?operation=download_node',
                    method: 'POST',
                    data: {url: url, name: name},
                    responseType: 'arraybuffer'
                }).then(function (response) {
                    console.log(response, response.headers()['content-type']);
                    var data = new Blob([response.data], {type: response.headers()['content-type']});
                    FileSaver.saveAs(data, response.config.data.name + '.zip');
                }, function (error) {
                    console.log(error);
                });
            };
            tmp.downloadFile = {};
            tmp.downloadFile.label = "Download";
            tmp.downloadFile.action = function (data) {
                var inst = $.jstree.reference(data.reference),
                    node = inst.get_node(data.reference);
                var url = node.id;
                var name = node.text;
                console.log(node);
                $http({
                    url: 'api/action?operation=download_node',
                    method: 'POST',
                    data: {url: url, name: name},
                }).then(function (response) {
                    console.log(response, response.headers()['content-type']);
                    var data = new Blob([response.data], {type: response.headers()['content-type']});
                    FileSaver.saveAs(data, response.config.data.name);
                }, function (error) {
                    console.log(error);
                });
            };
            tmp.uploadFolder = {};
            tmp.uploadFolder.label = "Upload";
            tmp.uploadFolder.action = function (data) {
                var inst = $.jstree.reference(data.reference),
                    node = inst.get_node(data.reference);
                var url = node.id;

                var upload = document.createElement('input');
                upload.style.display = 'none';
                upload.type = 'file';
                upload.name = 'file';
                upload.id = 'uploadFile';
                upload.addEventListener('change', function () {
                    var selectedFile = upload.files[0];
                    var fd = new FormData();
                    fd.append('file', selectedFile);
                    $http({
                        url: 'api/action?operation=upload_node&url=' + url,
                        method: 'PUT',
                        data: fd,
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    }).then(function (response) {
                        console.log(response);
                        if (response.data.code == 200) {
                            inst.refresh_node(node);
                        }
                    }, function (error) {
                        console.log(error);
                    });
                });
                upload.click();

            };
            if ($.jstree.reference(node).get_type(node) === "file") {
                delete tmp.create;
                delete tmp.downloadFolder;
                delete tmp.uploadFolder;
            }
            if ($.jstree.reference(node).get_type(node) === "folder") {
                delete tmp.downloadFile;
            }
            return tmp;
        };
        $scope.nodeRename = function (e, data) {
            console.log('rename', e, data);
            if (data.old !== data.text) {
                $http({
                    url: 'api/action?operation=rename_node',
                    method: 'POST',
                    data: {id: data.node.id, text: data.text, parent: data.node.parent}
                }).then(function (response) {
                    updateRenameTabs(data.node.id, response.data.id, data.text);

                    data.instance.set_id(data.node, response.data.id);
                    data.node.li_attr.base = response.data.id;
                    data.instance.refresh_node(data.node);
                }, function (error) {
                    console.log(error);
                    data.instance.refresh_node(data.node);
                });
                // console.log("new" data);
            }
        };

        $scope.nodeCopy = function (e, data) {
            console.log('copy', e, data);
            $http({
                url: 'api/action?operation=copy_node',
                method: 'POST',
                data: {id: data.original.id, parent: data.parent, text: data.original.text}
            }).then(function (response) {
                // data.instance.refresh_node(data.parent)
                data.instance.load_node(data.parent);
            }, function (err) {
                data.instance.refresh();
            });
        };

        $scope.nodeMove = function (e, data) {
            console.log('move', e, data);
            $http({
                url: 'api/action?operation=move_node',
                method: 'POST',
                data: {id: data.node.id, parent: data.parent, text: data.node.text}
            }).then(function (response) {
                // data.instance.refresh_node(data.parent)
                // console.log(response);
                updateMoveTabs(data.node.id, response.data.id);
                data.instance.load_node(data.parent);
            }, function (err) {
                data.instance.refresh();
            });
        };

        $scope.nodeDelete = function (e, data) {
            console.log('delete', e, data);
            $http({
                url: 'api/action?operation=delete_node',
                method: 'POST',
                data: {id: data.node.id}
            }).then(function (response) {
                updateDeleteTabs(data.node.id);
            }, function (err) {
                data.instance.refresh_node(data.node);
            });
        };

        $scope.nodeCreate = function (e, data) {
            console.log('create', e, data);
            $http({
                url: 'api/action?operation=create_node',
                method: 'POST',
                data: {type: data.node.type, parent: data.node.parent, text: data.node.text}
            }).then(function (response) {
                data.instance.set_id(data.node, response.data.id);
            }, function (err) {
                data.instance.refresh_node(data.node);
            });
        };

        $scope.nodeSelected = function (e, data) {

        };

        $scope.editorOptions = {
            lineNumbers: true,
            lineWrapping: true,
            extraKeys: {"Ctrl-Space": "autocomplete", "Ctrl-F": "findPersistent", "Ctrl-J": "toMatchingTag", "Ctrl-Q": "toggleComment"},
            //mode: {name: "text/html", globalVars: true},
            mode: 'application/x-httpd-php',
            selectionPointer: true,
            autoCloseTags: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            tabSize: 2,
            gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "breakpoints"],
            lint: true,
            // theme: theme,
            scrollbarStyle: "simple",
            profile: 'xhtml',
            matchTags: {bothTags: true},
            matchBrackets: true
        };
        $scope.codemirrorLoaded = function(_editor) {
            _editor.focus();
            change('demo.js', _editor);
        }(value);
    }

}());