(function () {
    'use strict';

    angular
        .module('app.controllers.profilecontroller', [])
        .controller('profileController', profileController);

    /** @ngInject */
    function profileController($scope, userService, $window, $timeout) {
        var vm = this;

        vm.countContribute = 0;
        vm.countProject = 0;

        userService
            .getUserInfo($window.sessionStorage.email)
            .then(function success(data) {
                vm.user = data.user;
            }, function error(error) {
                console.log(error);
            });

        vm.changeImage = changeImage;
        
        function createElementUpload() {
            let upload = document.createElement('input');
            upload.style.display = 'none';
            upload.type = 'file';
            upload.name = 'file';
            upload.accept = 'image/*';
            upload.onchange = function (e) {
                console.log(upload.files, e);
                let selectedFile = upload.files[0];
                let fd = new FormData();
                fd.append('file', selectedFile);
                userService
                    .uploadImage(fd)
                    .then(function success(data) {
                        console.log(data);
                    }, function error(error) {
                        console.log(error);
                    });
            };
            return upload;
        }

        function changeImage() {
            console.log('click');
            let upload = createElementUpload();
            upload.click();
            
        }

    }

}());