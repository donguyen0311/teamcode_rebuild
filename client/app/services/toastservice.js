(function () {
    'use strict';

    angular
        .module('app.services.toastservice', [])
        .factory('toastService', toastService);

    /** @ngInject */
    function toastService($mdToast, $mdDialog) {
        var services = {
            showToast: showToast
        };
        return services;

        function showToast(message, position, timeout) {
            var pinTo = position;
            var toast = $mdToast.simple()
                .textContent(message)
                .action('CLOSE')
                .highlightAction(true)
                .hideDelay(timeout)
                .highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
                .position(pinTo);
            $mdToast.show(toast).then((response) => {
                if (response == 'ok') {
                    $mdToast.hide();
                }
            });
        }
    }

}());