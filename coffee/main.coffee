ev = angular.module('evenn')

ev.config([
  '$routeProvider'
  '$tooltipProvider'
  '$dropdownProvider'
  '$httpProvider'
  '$intercomProvider'
  'FacebookProvider'
  ($routeProvider, $tooltipProvider, $dropdownProvider, $httpProvider, $intercomProvider, FacebookProvider) ->
    $routeProvider.when('/',
      templateUrl: 'events-home.html'
      controller: 'EventsHomeCtrl'
    ).when('/venn',
      templateUrl: 'venn.html'
      controller: 'VennCtrl'
    ).when('/genders',
      templateUrl: 'gender-ratio-index.html'
      controller: 'GenderRatioIndexCtrl'
    ).when('/events/:id/genders',
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

    angular.extend $dropdownProvider.defaults,
      animation: null

    FacebookProvider.init(
      appId: window.evennConfig.fb_app_id
      version: 'v2.2'
    )

    unless window.evennIsLocalhost
      $intercomProvider.appID(window.evennConfig.intercom_app_id)
      $intercomProvider.asyncLoading(true)

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
  '$intercom'
  'Facebook'
  ($rootScope, $location, $route, $timeout, $intercom, Facebook) ->
    $rootScope.rsvpMeta =
      colors:
        attending: 'success'
        unsure: 'warning'
        declined: 'danger'
        not_replied: 'active'
      words:
        invited: 'All invited'
        attending: 'Going'
        unsure: 'Maybe'
        declined: 'Declined'
        not_replied: 'Not replied'
      points:
        attending: 16
        unsure: 15
        declined: 14
        not_replied: 9
    $rootScope.genderMeta =
      names:
        m: 'male'
        f: 'female'
        n: 'neutral'
      capNames:
        m: 'Male'
        f: 'Female'
        n: 'Neutral first-name'
      icons:
        m: 'fa-male'
        f: 'fa-female'
        n: 'fa-user'

    $rootScope.user = {}
    $rootScope.location = $location
    noAuthRoutes = ['/login', '/about']

    delayedLoad = -> $timeout((-> $rootScope.evennLoaded = true), 1000)
    $rootScope.loadMe = (cb) ->
      Facebook.api('/me',
        fields: 'id,email,name,first_name,gender,timezone,link,picture'
      , (res) ->
        $rootScope.user.fb = res
        unless window.evennIsLocalhost
          $intercom.boot(
            user_id: res.id
            email: res.email
            name: res.name
            gender: res.gender
            link: res.link
          )
        cb()
      )
    
    $rootScope.$on('$locationChangeSuccess', (e, next, current) ->
      $intercom.update()
    )
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
        Facebook.getLoginStatus (res) ->
          if res.status is 'connected'
            $rootScope.loadMe ->
              $location.url('/select')
              $route.reload()
              delayedLoad()
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
