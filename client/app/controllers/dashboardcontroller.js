(function () {
    'use strict';

    angular
        .module('app.controllers.dashboardcontroller', [])
        .controller('dashboardController', dashboardController);

    /** @ngInject */
    function dashboardController($scope, $timeout) {
        var vm = this;

        $scope.models = {
            selected: null,
            lists: {
                "A": [],
                "B": [],
                "C": [],
                "D": []
            }
        };

        // Generate initial model
        for (var i = 1; i <= 3; ++i) {
            $scope.models.lists.A.push({
                label: "Item A" + i,
                name: "Name A" + i
            });
            $scope.models.lists.B.push({
                label: "Item B" + i,
                name: "Name B" + i
            });
            $scope.models.lists.C.push({
                label: "Item C" + i,
                name: "Name C" + i
            });
            $scope.models.lists.D.push({
                label: "Item D" + i,
                name: "Name D" + i
            });
        }

        $timeout(() => {
            $scope.models.lists.A.push({
                label: "Item A" + 10,
                name: "Name A" + 10
            });
        }, 2000);

        $scope.insertedEvent = function (action, index, external, type) {
            console.log(action, index, external, type);
        };
        // Model to JSON for demo purpose
        $scope.$watch('models', function (model) {
            $scope.modelAsJson = angular.toJson(model, true);
            console.log(model);
        }, true);

        init();

        function init() {
            
        }

    }

}());