(function(){
    'use strict';

    angular
        .module('app.services', [
            'app.services.userservice',
            'app.services.autheninterceptorservice',
            'app.services.toastservice',
            'app.services.socketservice'
        ]);

}());