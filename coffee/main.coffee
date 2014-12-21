ev = angular.module('evenn')

ev.config([
  '$routeProvider'
  '$tooltipProvider'
  '$modalProvider'
  '$popoverProvider'
  '$dropdownProvider'
  '$httpProvider'
  'FacebookProvider'
  ($routeProvider, $tooltipProvider, $modalProvider, $popoverProvider, $dropdownProvider, $httpProvider, FacebookProvider) ->
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

    $httpProvider.defaults.headers.common = {}
    $httpProvider.defaults.headers.post = {}
    $httpProvider.defaults.headers.put = {}
    $httpProvider.defaults.headers.patch = {}
])

ev.run([
  '$rootScope'
  '$location'
  '$route'
  '$timeout'
  'Facebook'
  ($rootScope, $location, $route, $timeout, Facebook) ->
    $rootScope.user = {}
    $rootScope.location = $location
    noAuthRoutes = ['/login', '/about']

    delayedLoad = -> $timeout((-> $rootScope.evennLoaded = true), 1000)
    
    $rootScope.$on('$locationChangeStart', (e, next, current) ->
      url = $location.url()
      if _.contains(noAuthRoutes, url)
        delayedLoad()
        return
      else if $rootScope.user.fb
        unless $rootScope.user.events
          delayedLoad()
          $location.url('/select')
      else
        e.preventDefault()
        Facebook.getLoginStatus (response) ->
          if response.status is 'connected'
            Facebook.api('/me', (response) ->
              $rootScope.user.fb = response
              $location.url('/select')
              $route.reload()
              delayedLoad()
            )
          else
            $location.url('/login')
            $route.reload()
            delayedLoad()

    )
])

ev.filter('cap', ->
  (input, scope) ->
    if input != null
      input = input.toLowerCase()
      input.substring(0,1).toUpperCase() + input.substring(1)
)
