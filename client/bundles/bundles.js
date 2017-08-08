"use strict";!function(){function e(e,t,r,o){function n(e,t,r){e.isAuthenticate()&&r(function(){t.go("structure.home")})}n.$inject=["userService","$state","$timeout"],o.interceptors.push("authInterceptor"),e.state("blank",{abstract:!0,views:{root:{templateUrl:"app/templates/blank.html"}},resolve:{isAuthenticate:n}}).state("structure",{abstract:!0,views:{root:{templateUrl:"app/templates/structure.html"}}}).state("structure.home",{url:"/",views:{header:{templateUrl:"app/templates/header.html",controller:"headerController",controllerAs:"vm"},content:{templateUrl:"app/templates/home.html",controller:"mainController",controllerAs:"vm"}}}).state("blank.login",{url:"/login",views:{"":{templateUrl:"app/templates/login.html",controller:"loginController",controllerAs:"vm"}}}).state("blank.register",{url:"/register",views:{"":{templateUrl:"app/templates/register.html",controller:"registerController",controllerAs:"vm"}}}).state("structure.profile",{url:"/profile",views:{header:{templateUrl:"app/templates/header.html",controller:"headerController",controllerAs:"vm"},content:{templateUrl:"app/templates/profile.html",controller:"profileController",controllerAs:"vm"}}}).state("structure.dashboard",{url:"/dashboard",views:{header:{templateUrl:"app/templates/header.html",controller:"headerController",controllerAs:"vm"},content:{templateUrl:"app/templates/dashboard.html",controller:"dashboardController",controllerAs:"vm"}}}).state("structure.editor",{url:"/editor",views:{header:{templateUrl:"app/templates/header.html",controller:"headerController",controllerAs:"vm"},content:{templateUrl:"app/templates/editor.html",controller:"editorController",controllerAs:"vm"}}}),r.otherwise("/")}e.$inject=["$stateProvider","$locationProvider","$urlRouterProvider","$httpProvider"],angular.module("myApp",["ngAnimate","ngSanitize","ngCookies","ui.bootstrap","ui.router","app.controllers","app.directives","app.services"]).config(e)}(),angular.module("app.controllers",["app.controllers.maincontroller","app.controllers.headercontroller","app.controllers.logincontroller","app.controllers.registercontroller","app.controllers.profilecontroller","app.controllers.dashboardcontroller","app.controllers.editorcontroller"]),function(){function e(e){}e.$inject=["$scope"],angular.module("app.controllers.dashboardcontroller",[]).controller("dashboardController",e)}(),function(){function e(e){}e.$inject=["$scope"],angular.module("app.controllers.editorcontroller",[]).controller("editorController",e)}(),function(){function e(e,t,r,o){var n=this;n.isNavCollapsed=!0,n.isAuthenticate=t.isAuthenticate,n.email=r.sessionStorage.email,n.logout=function(){t.logout().then(function(e){e.success&&o.go("blank.login")})}}e.$inject=["$scope","userService","$window","$state"],angular.module("app.controllers.headercontroller",[]).controller("headerController",e)}(),function(){function e(e,t,r,o){function n(e){s.alerts.splice(e,1)}function l(){t.login(s.user).then(function(e){e.success?(s.alerts.push({type:"success",msg:e.message}),o(function(){r.go("structure.profile")},2e3)):s.alerts.push({type:"danger",msg:e.message})},function(e){e&&r.go("blank.login")})}var s=this;s.alerts=[],s.login=l,s.closeAlert=n}e.$inject=["$scope","userService","$state","$timeout"],angular.module("app.controllers.logincontroller",[]).controller("loginController",e)}(),function(){function e(e,t){$("#particles").particleground({dotColor:"#796b6b",lineColor:"#796b6b"}),$("#intro").css({"margin-top":-$("#intro").height()/2})}e.$inject=["$scope","$cookies"],angular.module("app.controllers.maincontroller",[]).controller("mainController",e)}(),function(){function e(e,t){var r=this;r.countContribute=0,r.countProject=0,t.getUserInfo("donguyen0311@gmail.com")}e.$inject=["$scope","userService"],angular.module("app.controllers.profilecontroller",[]).controller("profileController",e)}(),function(){function e(e,t,r,o){function n(e){s.alerts.splice(e,1)}function l(){o.register(s.user).then(function(e){e.success?(s.alerts.push({type:"success",msg:e.message}),r(function(){t.go("blank.login")},2e3)):s.alerts.push({type:"danger",msg:e.message})},function(e){e&&t.go("blank.register")})}var s=this;s.alerts=[],s.register=l,s.closeAlert=n}e.$inject=["$scope","$state","$timeout","userService"],angular.module("app.controllers.registercontroller",[]).controller("registerController",e)}(),angular.module("app.directives",[]),function(){function e(e,t,r,o){return{request:function(e){return e.headers=e.headers||{},t.sessionStorage.token&&(e.headers["x-access-token"]=t.sessionStorage.token),e},response:function(e){return e},responseError:function(e){return 403===e.status&&r.go("blank.login"),e}}}e.$inject=["$q","$window","$state","$location"],angular.module("app.services.autheninterceptorservice",[]).factory("authInterceptor",e)}(),angular.module("app.services",["app.services.userservice","app.services.autheninterceptorservice"]),function(){function e(e,t,r,o){return{login:function(r){var n=t.defer();return e.post("/api/authenticate",r).then(function(e){console.log(e),e.data.success&&(o.sessionStorage.token=e.data.token,o.sessionStorage.email=r.email),n.resolve(e.data)},function(e){n.reject(e)}),n.promise},register:function(r){var o=t.defer();return e.post("/api/register",r).then(function(e){console.log(e),o.resolve(e.data)},function(e){o.reject(e)}),o.promise},authentication:function(){return t.defer().promise},logout:function(){var e=t.defer();return delete o.sessionStorage.token,delete o.sessionStorage.email,e.resolve({success:!0}),e.promise},getUserInfo:function(r){var o=t.defer();return e.get("/api/users/"+r).then(function(e){console.log(e)},function(e){console.log(e)}),o.promise},isAuthenticate:function(){return!(!o.sessionStorage.token||!o.sessionStorage.email)}}}e.$inject=["$http","$q","$cookies","$window"],angular.module("app.services.userservice",[]).factory("userService",e)}();