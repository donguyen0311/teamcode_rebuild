(function () {
    'use strict';

    angular
        .module('app.services.userservice', [])
        .factory('userService', userService);

    /** @ngInject */
    function userService($http, $q, $cookies, $window) {
        var services = {
            login: login,
            register: register,
            authentication: authentication,
            logout: logout, 
            getUserInfo: getUserInfo,
            isAuthenticate: isAuthenticate,
            uploadImage: uploadImage
        };
        return services;

        function uploadImage(fd) {
            var deferred = $q.defer();
            $http
                .put('/api/users/image', fd, { transformRequest: angular.identity, headers: { 'Content-Type': undefined } })
                .then(function success(response) {
                    deferred.resolve(response.data);
                }, function error(error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function isAuthenticate() {
            if ($window.sessionStorage.token && $window.sessionStorage.email) {
                return true;
            }
            return false;
        }

        function getUserInfo(email) {
            var deferred = $q.defer();
            $http
                .get('/api/users/' + email)
                .then(function success(response) {
                    deferred.resolve(response.data);
                }, function error(error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function login(data) {
            var deferred = $q.defer();
            $http
                .post('/api/login', data)
                .then(function success(response) {
                    console.log(response);
                    if (response.data.success) {
                        $window.sessionStorage.token = response.data.token;
                        $window.sessionStorage.email = data.email;
                    }
                    deferred.resolve(response.data);
                }, function error(error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function register(data) {
            var deferred = $q.defer();
            $http
                .post('/api/register', data)
                .then(function sucess(response) {
                    console.log(response);
                    deferred.resolve(response.data);
                }, function error(error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function authentication() {
            var deferred = $q.defer();
            $http
                .get('/api/authenticate')
                .then(function success(response) {
                    deferred.resolve(response.data);
                }, function error(error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function logout() {
            var deferred = $q.defer();
            delete $window.sessionStorage.token;
            delete $window.sessionStorage.email;
            deferred.resolve({success: true});
            return deferred.promise;
        }

    }

}());