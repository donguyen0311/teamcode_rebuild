(function(){
    'use strict';

    angular
        .module('app.controllers.headercontroller', [])
        .controller('headerController', headerController)

    /** @ngInject */
    function headerController($scope, userService, $window, $state){
        var vm = this;
        
        vm.isNavCollapsed = true;
        vm.isAuthenticate = userService.isAuthenticate;
        vm.email = $window.sessionStorage.email;
        vm.logout = logout;

        function logout() {
            userService.logout().then((data) => {
                if (data.success) {
                    $state.go('blank.login');
                }
            });
        }
        init();

        function init(){
        }

    }

}());