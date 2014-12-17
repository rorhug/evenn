ev = angular.module('evenn')

ev.controller('MainCtrl', [
  '$scope'
  '$http'
  '$location'
  'Facebook'
  ($scope, $http, $location, Facebook) ->
    $scope.user = {}

    goingToPath = $location.url()
    $location.url('/loading')

    Facebook.getLoginStatus (response) ->
      if response.status is 'connected'
        Facebook.api('/me', (response) ->
          $scope.user.fb = response
          $location.url('/select')
          bindRedirector()
        )
      else
        $location.url('/login')
        bindRedirector()

    bindRedirector = ->
      $scope.$on('$locationChangeStart', (e) ->
        if $scope.user.fb
          if $location.url() isnt '/select' and not $scope.user.events
            $location.url('/select')
        else
          $location.url('/login') unless _.contains(['/login', '/loading'], $location.url())
    )
])

ev.controller('LoginCtrl', [
  '$scope'
  '$http'
  '$location'
  'Facebook'
  ($scope, $http, $location, Facebook) ->
    $scope.login = ->
      Facebook.login((response) ->
        $location.url('/select') if response.status is 'connected'
      , { scope: 'user_events' })
])

ev.controller('SelectEventsCtrl', [
  '$scope'
  '$location'
  '$timeout'
  '$analytics'
  'Facebook'
  'FbEvent'
  'UserStore'
  ($scope, $location, $timeout, $analytics, Facebook, FbEvent, UserStore) ->

    async.reduce(['attending', 'not_replied', 'maybe', 'declined'], [], (memo, status, cb) ->
      Facebook.api("/me/events/#{status}",
        limit: 50
        since: Math.round(new Date().getTime() / 1000)
      , (events) ->
        cb(null, memo.concat(events.data))
      )
    , (err, events) ->
      $scope.availableEvents = events
      $analytics.eventTrack('events_select_length',
        category: 'interesting'
        label: "#{events.length}"
      )
    )
    
    selectedEvents = -> _.filter($scope.availableEvents, 'selected')
    $scope.updateSelectedEventCount = ->
      $scope.selectedEventCount = selectedEvents().length

    $scope.analyseEvents = ->
      selectedEvents = selectedEvents()
      $scope.loadingMessage = "Loading #{selectedEvents.length} events..."
      loadedCount = 0

      async.reduce(selectedEvents, {}, (memo, event, cb) ->
        memo[event.id] = new FbEvent(event, ->
          loadedCount += 1
          $scope.loadingMessage = "Loaded #{loadedCount} of #{selectedEvents.length}"
          cb(null, memo)
        )
      , (err, events) ->
        $scope.user.events = events
        $scope.user.eventIds = Object.keys(events)
        $scope.loadingMessage = "Event download complete. Please wait..."
        $timeout( ->
          label = "#{$scope.user.eventIds.length}e#{_.size(UserStore.users)}u"
          $analytics.eventTrack('analyse',
            category: 'interesting'
            label: label
          )
          $location.url('/')
          $scope.user.eventsReady = true
        , 1000)
      )
])

ev.controller('EventsHomeCtrl', [
  '$scope'
  ($scope) ->
])

ev.controller('TableCtrl', [
  '$scope'
  '$routeParams'
  'UserStore'
  ($scope, $routeParams, UserStore) ->
    $scope.highlightId = $routeParams.highlight
    $scope.attendees = _.values(UserStore.users)
])

ev.controller('VennCtrl', [
  '$scope'
  ($scope) ->
])

ev.controller('GenderRatiosCtrl', [
  '$scope'
  ($scope) ->
])
