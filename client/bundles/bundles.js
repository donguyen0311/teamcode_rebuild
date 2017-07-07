(function () {
    'use strict';

    mainConfig.$inject = ["$stateProvider", "$locationProvider", "$urlRouterProvider", "$httpProvider"];
    angular
        .module('myApp', [
            'ngAnimate',
            'ngSanitize',
            'ngCookies',
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
    }

}());
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
(function(){
    'use strict';

    dashboardController.$inject = ["$scope"];
    angular
        .module('app.controllers.dashboardcontroller', [])
        .controller('dashboardController', dashboardController)

    /** @ngInject */
    function dashboardController($scope){
        var vm = this;
        
        init();

        function init(){
        }

    }

}());
(function(){
    'use strict';

    editorController.$inject = ["$scope"];
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
(function(){
    'use strict';

    headerController.$inject = ["$scope", "userService", "$window", "$state"];
    angular
        .module('app.controllers.headercontroller', [])
        .controller('headerController', headerController)

    /** @ngInject */
    function headerController($scope, userService, $window, $state){
        var vm = this;
        
        vm.isNavCollapsed = true;
        vm.isAuthenticate = userService.isAuthenticate;
        vm.email = $window.sessionStorage.email;
        vm.logout = logout;

        function logout() {
            userService.logout().then((data) => {
                if (data.success) {
                    $state.go('blank.login');
                }
            });
        }
        init();

        function init(){
        }

    }

}());
(function () {
    'use strict';

    loginController.$inject = ["$scope", "userService", "$state"];
    angular
        .module('app.controllers.logincontroller', [])
        .controller('loginController', loginController)

    /** @ngInject */
    function loginController($scope, userService, $state) {
        var vm = this;

        init();

        function init() {
            vm.login = login;
        }

        function login() {
            userService
                .login(vm.user)
                .then(function success(data) {
                    if (data.success) {
                        $state.go('structure.profile');
                    }
                }, function error(error) {
                   if (error) {
                       $state.go('structure.login');
                   }
                });
        }
    }

}());
(function(){
    'use strict';

    mainController.$inject = ["$scope", "$cookies"];
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
(function(){
    'use strict';

    profileController.$inject = ["$scope", "userService"];
    angular
        .module('app.controllers.profilecontroller', [])
        .controller('profileController', profileController)

    /** @ngInject */
    function profileController($scope, userService) {
        var vm = this;
        
        vm.countContribute = 0;
        vm.countProject = 0;

        userService.getUserInfo('donguyen0311@gmail.com');

        init();

        function init() {
        }

    }

}());
(function(){
    'use strict';

    registerController.$inject = ["$scope"];
    angular
        .module('app.controllers.registercontroller', [])
        .controller('registerController', registerController)

    /** @ngInject */
    function registerController($scope){
        var vm = this;
        
        init();

        function init() {

        }

    }

}());
(function(){
    'use strict';

    angular
        .module('app.directives', [
            
        ]);

}());
(function () {
    'use strict';

    authInterceptor.$inject = ["$q", "$window", "$state", "$location"];
    angular
        .module('app.services.autheninterceptorservice', [])
        .factory('authInterceptor', authInterceptor)

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

(function(){
    'use strict';

    angular
        .module('app.services', [
            'app.services.userservice',
            'app.services.autheninterceptorservice'
        ]);

}());
(function () {
    'use strict';

    userService.$inject = ["$http", "$q", "$cookies", "$window"];
    angular
        .module('app.services.userservice', [])
        .factory('userService', userService)

    /** @ngInject */
    function userService($http, $q, $cookies, $window) {
        var services = {
            login: login,
            register: register,
            authentication: authentication,
            logout: logout, 
            getUserInfo: getUserInfo,
            isAuthenticate: isAuthenticate
        };
        return services;

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
                    console.log(response);
                }, function error(error) {
                    console.log(error);
                });
            return deferred.promise;
        }

        function login(data) {
            var deferred = $q.defer();
            $http
                .post('/api/authenticate', data)
                .then(function success(response) {
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

        function register() {
            var deferred = $q.defer();
            return deferred.promise;
        }

        function authentication() {
            var deferred = $q.defer();
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