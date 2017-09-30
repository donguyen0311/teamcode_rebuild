(function () {
    'use strict';

    angular
        .module('app.controllers.headercontroller', [])
        .controller('headerController', headerController);

    /** @ngInject */
    function headerController($scope, userService, $window, $state, $timeout, $mdSidenav, $mdDialog) {
        var vm = this;

        vm.toggleLeft = buildToggler('left');
        vm.toggleRight = buildToggler('right');

        vm.isNavCollapsed = true;
        vm.isAuthenticate = userService.isAuthenticate;
        vm.email = $window.sessionStorage.email;
        vm.logout = logout;
        vm.openMenu = openMenu;

        function openMenu($mdMenu, ev) {
            // originatorEv = ev;
            $mdMenu.open(ev);
        }

        function buildToggler(componentId) {
            return function () {
                $mdSidenav(componentId).toggle();
            };
        }

        function logout() {
            userService.logout().then((data) => {
                if (data.success) {
                    $state.go('blank.login');
                }
            });
        }
        init();

        function init() {}

    }

}());