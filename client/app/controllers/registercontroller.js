(function(){
    'use strict';

    angular
        .module('app.controllers.registercontroller', [])
        .controller('registerController', registerController);

    /** @ngInject */
    function registerController($scope, $state, $timeout, userService, toastService){
        var vm = this;
        
        vm.alerts = [];

        init();

        function init() {
            vm.register = register;

        }
        function register() {
            userService
                .register(vm.user)
                .then(function success(data) {
                    if (data.success) {
                        toastService.showToast(data.message, 'top right', 2000);
                        $timeout(() => {
                            $state.go('blank.login');
                        }, 2000);
                    } else {
                        toastService.showToast(data.message, 'top right', 5000);
                    }
                }, function error(error) {
                   if (error) {
                       $state.go('blank.register');
                   }
                });
        }
    }

}());