(function () {
    'use strict';

    angular
        .module('app.controllers.logincontroller', [])
        .controller('loginController', loginController);

    /** @ngInject */
    function loginController($scope, userService, $state) {
        var vm = this;

        init();

        function init() {
            vm.login = login;
        }

        function login() {
            userService
                .login(vm.user)
                .then(function success(data) {
                    if (data.success) {
                        $state.go('structure.profile');
                    }
                }, function error(error) {
                   if (error) {
                       $state.go('blank.login');
                   }
                });
        }
    }

}());