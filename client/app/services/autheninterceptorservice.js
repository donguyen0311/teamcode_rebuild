(function () {
    'use strict';

    angular
        .module('app.services.autheninterceptorservice', [])
        .factory('authInterceptor', authInterceptor);

    /** @ngInject */
    function authInterceptor($q, $window, $state, $location) {

        var services = {
            request: function (config) {
                config.headers = config.headers || {};
                if ($window.sessionStorage.token) {
                    config.headers['x-access-token'] = $window.sessionStorage.token;
                }
                return config;
            },
            response: function (response) {
                return response;
            },
            responseError: function(response) {
                if (response.status === 403) {
                    // handle the case where the user is not authenticated
                    $state.go('blank.login');
                }
                return response;
            }
        };
        return services;
    }

}());