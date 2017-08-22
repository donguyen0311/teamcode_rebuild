(function () {
    'use strict';

    angular
        .module('myApp', [
            'ngAnimate',
            'ngSanitize',
            'ngCookies',
            'dndLists',
            'ui.bootstrap',
            // 'ngMaterial',
            'ui.router',
            'app.controllers',
            'app.directives',
            'app.services'
        ])
        .config(mainConfig);

    /** @ngInject */
    function mainConfig($stateProvider, $locationProvider, $urlRouterProvider, $httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
        
        $stateProvider
            .state('blank', {
                abstract: true,
                views: {
                    'root': {
                        templateUrl: 'app/templates/blank.html',
                    }
                },
                resolve: {
                    isAuthenticate : _isAuthenticate
                }
            })
            .state('structure', {
                abstract: true,
                views: {
                    'root': {
                        templateUrl: 'app/templates/structure.html',
                    }
                }
            })
            .state('structure.home', {
                url: '/',
                views: {
                    'header': {
                        templateUrl: 'app/templates/header.html',
                        controller: 'headerController',
                        controllerAs: 'vm'
                    },
                    'content': {
                        templateUrl: 'app/templates/home.html',
                        controller: 'mainController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('blank.login', {
                url: '/login',
                views: {
                    '': {
                        templateUrl: 'app/templates/login.html',
                        controller: 'loginController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('blank.register', {
                url: '/register',
                views: {
                    '': {
                        templateUrl: 'app/templates/register.html',
                        controller: 'registerController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('structure.profile', {
                url: '/profile',
                views: {
                    'header': {
                        templateUrl: 'app/templates/header.html',
                        controller: 'headerController',
                        controllerAs: 'vm'
                    },
                    'content': {
                        templateUrl: 'app/templates/profile.html',
                        controller: 'profileController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('structure.dashboard', {
                url: '/dashboard',
                views: {
                    'header': {
                        templateUrl: 'app/templates/header.html',
                        controller: 'headerController',
                        controllerAs: 'vm'
                    },
                    'content': {
                        templateUrl: 'app/templates/dashboard.html',
                        controller: 'dashboardController',
                        controllerAs: 'vm'
                    }
                }
            })
            .state('structure.editor', {
                url: '/editor',
                views: {
                    'header': {
                        templateUrl: 'app/templates/header.html',
                        controller: 'headerController',
                        controllerAs: 'vm'
                    },
                    'content': {
                        templateUrl: 'app/templates/editor.html',
                        controller: 'editorController',
                        controllerAs: 'vm'
                    }
                }
            });
        // Send to login if the URL was not found
        $urlRouterProvider.otherwise("/");

        /** @ngInject */
        function _isAuthenticate(userService, $state, $timeout) {
            if (userService.isAuthenticate()) {
                $timeout(function () {
                    $state.go('structure.home');
                });
            }
        }

    }

}());