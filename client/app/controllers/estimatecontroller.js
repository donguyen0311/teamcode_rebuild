(function(){
    'use strict';

    angular
        .module('app.controllers.estimatecontroller', [])
        .controller('estimateController', estimateController);

    /** @ngInject */
    function estimateController($scope, $cookies) {
        var vm = this;
        
        init();

        function init() {
            
        }
        
    }

}());