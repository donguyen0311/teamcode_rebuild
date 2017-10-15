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
                dotColor: '#796b6b',
                lineColor: '#796b6b'
            });
            
            $('#intro').css({
                'margin-top': -($('#intro').height() / 2)
            });
        }
        
    }

}());