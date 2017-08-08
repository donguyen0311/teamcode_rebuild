(function(){
    'use strict';

    angular
        .module('app.controllers.registercontroller', [])
        .controller('registerController', registerController);

    /** @ngInject */
    function registerController($scope, $state, $timeout, userService){
        var vm = this;
        
        vm.alerts = [];

        init();

        function init() {
            vm.register = register;
            vm.closeAlert = closeAlert;
        }

        function closeAlert (index) {
            vm.alerts.splice(index, 1);
        }

        function register() {
            userService
                .register(vm.user)
                .then(function success(data) {
                    if (data.success) {
                        vm.alerts.push({
                            type: 'success',
                            msg: data.message
                        });
                        $timeout(() => {
                            $state.go('blank.login');
                        }, 2000);
                    } else {
                        vm.alerts.push({
                            type: 'danger',
                            msg: data.message
                        });
                    }
                }, function error(error) {
                   if (error) {
                       $state.go('blank.register');
                   }
                });
        }

    }

}());