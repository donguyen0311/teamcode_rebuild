(function () {
    'use strict';

    angular
        .module('app.controllers.logincontroller', [])
        .controller('loginController', loginController);

    /** @ngInject */
    function loginController($scope, userService, $state, $timeout, toastService) {
        var vm = this;

        vm.alerts = [];

        init();

        function init() {
            vm.login = login;
        }
        
        function login() {
            userService
                .login(vm.user)
                .then(function success(data) {
                    if (data.success) {
                        toastService.showToast(data.message, 'top right', 2000);
                        $timeout(() => {
                            $state.go('structure.profile');
                        }, 2000);
                    } else {
                        toastService.showToast(data.message, 'top right', 5000);
                    }
                }, function error(error) {
                    if (error) {
                        $state.go('blank.login');
                    }
                });
        }
    }

}());