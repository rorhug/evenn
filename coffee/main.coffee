ev = angular.module('evenn')

ev.config([
  '$routeProvider'
  '$tooltipProvider'
  '$modalProvider'
  '$popoverProvider'
  '$dropdownProvider'
  '$analyticsProvider'
  'FacebookProvider'
  ($routeProvider, $tooltipProvider, $modalProvider, $popoverProvider, $dropdownProvider, $analyticsProvider, FacebookProvider) ->
    $routeProvider.when('/',
      templateUrl: 'events-home.html'
      controller: 'EventsHomeCtrl'
    ).when('/venn',
      templateUrl: 'venn.html'
      controller: 'VennCtrl'
    ).when('/genders',
      templateUrl: 'gender-ratio-index.html'
      controller: 'GenderRatioIndexCtrl'
    ).when('/genders/:id',
      templateUrl: 'gender-ratio-show.html'
      controller: 'GenderRatioShowCtrl'
    ).when('/table',
      templateUrl: 'table.html'
      controller: 'TableCtrl'
    ).when('/loading',
      templateUrl: 'loading.html'
    ).when('/select',
      templateUrl: 'select.html'
      controller: 'SelectEventsCtrl'
    ).when('/login',
      templateUrl: 'login.html'
      controller: 'LoginCtrl'
    ).when('/about',
      templateUrl: 'about.html'
    )

    angular.extend $tooltipProvider.defaults,
      # animation: null
      trigger: 'hover'
      placement: 'bottom'
      container: 'body'

    angular.extend $modalProvider.defaults,
      container: 'body'
      # animation: null
      backdropAnimation: null

    angular.extend $popoverProvider.defaults,
      container: 'body'
      animation: null

    angular.extend $dropdownProvider.defaults,
      animation: null

    FacebookProvider.init(
      appId: '316035781927497'
      version: 'v2.2'
    )
])

ev.run([
  '$rootScope'
  '$location'
  ($rootScope, $location) ->
    $rootScope.location = $location
])

ev.filter('cap', ->
  (input, scope) ->
    if input != null
      input = input.toLowerCase()
      input.substring(0,1).toUpperCase() + input.substring(1)
)
