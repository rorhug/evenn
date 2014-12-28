ev = angular.module('evenn')

ev.controller('MainCtrl', [
  '$window'
  '$scope'
  '$http'
  '$location'
  'Facebook'
  'UserStore'
  ($window, $scope, $http, $location, Facebook, UserStore) ->
    $scope.goBack = ->
      $window.history.back()

    $scope.logout = ->
      Facebook.logout()
      _.forEach(Object.keys($scope.user), (k) -> delete $scope.user[k])
      UserStore.removeAll()
      $location.url("/login")

    $scope.changeEvents = ->
      _.forEach(_.without(Object.keys($scope.user), 'fb'), (k) -> delete $scope.user[k])
      UserStore.removeAll()
      $location.url('/select')
])

ev.controller('LoginCtrl', [
  '$scope'
  '$http'
  '$location'
  '$alert'
  'Facebook'
  ($scope, $http, $location, $alert, Facebook) ->
    neededPermissions = ['user_events', 'rsvp_event', 'email']
    $scope.login = ->
      Facebook.login((response) ->
        availablePermissions = response.authResponse.grantedScopes.split(',')
        if response.status is 'connected'
          # If all permissions are permitted
          if _.without.apply(_, [neededPermissions].concat(availablePermissions)).length is 0
            return $scope.loadMe -> $location.url('/select')
          else
            $scope.loginError = "Error logging in. All permissions must be accepted!"
        else
          $scope.loginError = "There was a problem logging into Facebook!"
        Facebook.logout()
      ,
        scope: neededPermissions.join(',')
        return_scopes: true
        auth_type: 'rerequest'
      )
])

ev.controller('SelectEventsCtrl', [
  '$scope'
  '$location'
  '$timeout'
  '$analytics'
  '$intercom'
  'Facebook'
  'FbEvent'
  'UserStore'
  ($scope, $location, $timeout, $analytics, $intercom, Facebook, FbEvent, UserStore) ->
    $scope.user.events = null
    $scope.user.eventIds = null
    async.reduce(['attending', 'not_replied', 'maybe', 'declined'], [], (memo, status, cb) ->
      Facebook.api("/me/events/#{status}",
        limit: 50
        since: Math.round(new Date().getTime() / 1000) - 86400
      , (events) ->
        cb(null, memo.concat(events.data))
      )
    , (err, events) ->
      $scope.availableEvents = events
      $intercom.trackEvent('events_select_length',
        event_count: events.length
      )
    )
    
    $scope.maxSelection = 5
    selectedEvents = -> _.filter($scope.availableEvents, 'selected')
    $scope.selectedEventCount = 0
    $scope.updateSelectedEventCount = ->
      $scope.selectedEventCount = selectedEvents().length

    $scope.analyseEvents = ->
      $scope.loadingMessage = "-*- START ANALYSIS -*-"
      addLoadingLine = (l) -> $scope.loadingMessage += "\n#{l}"
      selectedEvents = selectedEvents().slice(0, $scope.maxSelection)
      return unless selectedEvents.length
      addLoadingLine("Loading #{selectedEvents.length} events...")
      loadedCount = 0

      async.reduce(selectedEvents, {}, (memo, event, cb) ->
        memo[event.id] = new FbEvent(event, ->
          loadedCount += 1
          addLoadingLine("Loaded #{loadedCount} of #{selectedEvents.length} ('#{event.name}')")
          cb(null, memo)
        )
      , (err, events) ->
        $scope.user.events = events
        $scope.user.eventIds = Object.keys(events)
        addLoadingLine("Event download complete. Getting gender data...")
        UserStore.getAllGenders((users) ->
          addLoadingLine("Genders done. Counting shit...")
          _.forEach($scope.user.events, (e) -> e.generateAllEventStats())
          addLoadingLine("-*- ANALYSIS COMPLETE -*-\nPlease wait...")
          $timeout( ->
            $location.url('/')
            $scope.user.eventsReady = true
          , 500)
        )
      )
])

ev.controller('EventsHomeCtrl', [
  '$scope'
  '$intercom'
  'UserStore'
  ($scope, $intercom, UserStore) ->
    $intercom.trackEvent('events_home',
      total_facebook_users: _.size(UserStore.users)
      event_count: $scope.user.eventIds.length
      event_ids: _.pluck($scope.user.events, 'id').join(",")
      event_names: _.pluck($scope.user.events, 'name').join(",")
      event_invited_counts: _.pluck($scope.user.events, 'invitedCount').join(",")
    )
])

ev.controller('TableCtrl', [
  '$scope'
  '$routeParams'
  'UserStore'
  '$intercom'
  ($scope, $routeParams, UserStore, $intercom) ->
    $scope.highlightId = $routeParams.highlight
    $scope.attendees = _.sortBy(_.values(UserStore.users), (user) -> -user.getScore())
    $intercom.trackEvent('view_table',
      highlight_id: $scope.highlightId
    )
])

ev.controller('VennCtrl', [
  '$scope'
  ($scope) ->
])

ev.controller('GenderRatioIndexCtrl', [
  '$scope'
  'UserStore'
  '$intercom'
  ($scope, UserStore, $intercom) ->
    $intercom.trackEvent('view_gender_ratio_index')
])

ev.controller('GenderRatioShowCtrl', [
  '$scope'
  '$routeParams'
  'UserStore'
  '$intercom'
  ($scope, $routeParams, UserStore, $intercom) ->
    $scope.event = $scope.user.events[$routeParams.id]
    $intercom.trackEvent('view_gender_ratio_show',
      event_id: $scope.event.id
      female_attending_count: $scope.event.genderCounts.attending.f
      male_attending_count: $scope.event.genderCounts.attending.m
      neutral_attending_count: $scope.event.genderCounts.attending.n
    )
])
