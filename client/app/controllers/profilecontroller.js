(function(){
    'use strict';

    angular
        .module('app.controllers.profilecontroller', [])
        .controller('profileController', profileController)

    /** @ngInject */
    function profileController($scope, userService) {
        var vm = this;
        
        vm.countContribute = 0;
        vm.countProject = 0;

        userService.getUserInfo('donguyen0311@gmail.com');

        init();

        function init() {
        }

    }

}());