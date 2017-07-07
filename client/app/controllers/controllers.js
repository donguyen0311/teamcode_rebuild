(function(){
    'use strict';

    angular
        .module('app.controllers', [
            'app.controllers.maincontroller',
            'app.controllers.headercontroller',
            'app.controllers.logincontroller',
            'app.controllers.registercontroller',
            'app.controllers.profilecontroller',
            'app.controllers.dashboardcontroller',
            'app.controllers.editorcontroller'
        ]);

}());