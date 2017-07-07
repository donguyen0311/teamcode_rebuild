(function(){
    'use strict';

    angular
        .module('app.controllers.dashboardcontroller', [])
        .controller('dashboardController', dashboardController);

    /** @ngInject */
    function dashboardController($scope){
        var vm = this;
        
        init();

        function init(){
        }

    }

}());