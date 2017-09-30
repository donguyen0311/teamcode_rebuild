(function(){
    'use strict';

    angular
        .module('app.controllers.sidebarcontroller', [])
        .controller('sidebarController', sidebarController);

    /** @ngInject */
    function sidebarController($scope, userService, $state){
        var vm = this;
        vm.logout = logout;


        init();

        function init(){
        }

        function logout() {
            userService.logout().then((data) => {
                if (data.success) {
                    $state.go('blank.login');
                }
            });
        }

    }

}());