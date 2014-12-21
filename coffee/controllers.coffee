ev = angular.module('evenn')

ev.controller('MainCtrl', [
  '$window'
  '$scope'
  '$http'
  '$location'
  'Facebook'
  ($window, $scope, $http, $location, Facebook) ->
    $scope.goBack = ->
      $window.history.back()

    $scope.logout = ->
      Facebook.logout()
      _.forEach(Object.keys($scope.user), (k) -> $scope.user[k])
      $location.url("/login")
])

ev.controller('LoginCtrl', [
  '$scope'
  '$http'
  '$location'
  '$alert'
  'Facebook'
  ($scope, $http, $location, $alert, Facebook) ->
    $scope.login = ->
      Facebook.login((response) ->
        availablePermissions = response.authResponse.grantedScopes.split(',')
        if response.status is 'connected'
          if _.contains(availablePermissions, 'user_events') && _.contains(availablePermissions, 'rsvp_event')
            return Facebook.api('/me', (response) ->
              $scope.user.fb = response
              $location.url('/select')
            )
          else
            $scope.loginError = "Error logging in. All permissions must be accepted!"
        else
          $scope.loginError = "There was a problem logging into Facebook!"
        Facebook.logout()
      ,
        scope: 'user_events,rsvp_event'
        return_scopes: true
        auth_type: 'rerequest'
      )
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
        since: Math.round(new Date().getTime() / 1000) - 86400
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
    
    $scope.maxSelection = 5
    selectedEvents = -> _.filter($scope.availableEvents, 'selected')
    $scope.selectedEventCount = 0
    $scope.updateSelectedEventCount = ->
      $scope.selectedEventCount = selectedEvents().length

    $scope.analyseEvents = ->
      selectedEvents = selectedEvents().slice(0, $scope.maxSelection)
      return unless selectedEvents.length
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

ev.controller('GenderRatioIndexCtrl', [
  '$scope'
  'UserStore'
  ($scope, UserStore) ->
    UserStore.getAllGenders((users) ->
      $scope.gendersLoaded = true
    )
])
