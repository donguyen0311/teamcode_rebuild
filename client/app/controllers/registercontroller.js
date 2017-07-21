(function(){
    'use strict';

    angular
        .module('app.controllers.registercontroller', [])
        .controller('registerController', registerController);

    /** @ngInject */
    function registerController($scope, $state, userService){
        var vm = this;
        
        init();

        function init() {
            vm.register = register
        }

        function register() {
            userService
                .register(vm.user)
                .then(function success(data) {
                    if (data.success) {
                        $state.go('blank.login');
                    }
                }, function error(error) {
                   if (error) {
                       $state.go('blank.register');
                   }
                });
        }

    }

}());