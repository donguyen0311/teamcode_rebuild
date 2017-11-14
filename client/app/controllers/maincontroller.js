(function(){
    'use strict';

    angular
        .module('app.controllers.maincontroller', [])
        .controller('mainController', mainController);

    /** @ngInject */
    function mainController($scope, $cookies) {
        var vm = this;

        init();

        function init() {
            $('#particles').particleground({
                dotColor: '#a5a5a5',
                lineColor: '#a5a5a5'
            });
            
            $('#intro').css({
                'margin-top': -($('#intro').height() / 2)
            });
        }
        
    }

}());