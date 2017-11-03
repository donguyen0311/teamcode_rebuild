(function () {
    'use strict';

    angular
        .module('app.services.socketservice', [])
        .factory('socket', socketService);

    /** @ngInject */
    function socketService($rootScope) {
        var socket = io.connect();

        var services = {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }
        };
        return services;
    }

}());