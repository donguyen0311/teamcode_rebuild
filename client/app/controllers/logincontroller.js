(function () {
    'use strict';

    angular
        .module('app.controllers.logincontroller', [])
        .controller('loginController', loginController);

    /** @ngInject */
    function loginController($scope, userService, $state, $timeout) {
        var vm = this;

        vm.alerts = [];

        init();

        function init() {
            vm.login = login;
            vm.closeAlert = closeAlert;
        }
        
        function closeAlert (index) {
            vm.alerts.splice(index, 1);
        }

        function login() {
            userService
                .login(vm.user)
                .then(function success(data) {
                    if (data.success) {
                        vm.alerts.push({
                            type: 'success',
                            msg: data.message
                        });
                        $timeout(() => {
                            $state.go('structure.profile');
                        }, 2000);
                    } else {
                        vm.alerts.push({
                            type: 'danger',
                            msg: data.message
                        });
                    }
                }, function error(error) {
                    if (error) {
                        $state.go('blank.login');
                    }
                });
        }
    }

}());