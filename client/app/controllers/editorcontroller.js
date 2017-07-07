(function(){
    'use strict';

    angular
        .module('app.controllers.editorcontroller', [])
        .controller('editorController', editorController)

    /** @ngInject */
    function editorController($scope){
        var vm = this;
        
        init();

        function init(){
        }

    }

}());