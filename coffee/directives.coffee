ev = angular.module('evenn')

ev.directive('loader', [->
  restrict: 'AE'
  replace: true
  template: """
    <div class="spinner">
      <div class="rect1"></div>
      <div class="rect2"></div>
      <div class="rect3"></div>
      <div class="rect4"></div>
      <div class="rect5"></div>
    </div>
  """
])

ev.directive('genderRatio', [->
  restrict: 'AE'
  scope:
    counts: "="
  template: """
    <span>
      <span class="text-danger">{{counts.ratio}} {{counts.isFemaleToMale ? 'girls' : 'guys'}}</span> to
      <span class="text-info">1 {{counts.isFemaleToMale ? 'guy' : 'girl'}}</span>
    </span>
  """
])

ev.directive('genderCounts', [->
  restrict: 'AE'
  scope:
    counts: "="
    rsvp: "="
  template: """
    <span>
      <span class="text-danger">{{counts[rsvp].f}} <i class="fa fa-female"></i></span>
      <span class="text-info">{{counts[rsvp].m}} <i class="fa fa-male"></i></span>
      <span ng-show="counts[rsvp].n" class="text-muted">{{counts[rsvp].n}} <i class="fa fa-user"></i></span>
    </span>
  """
])

ev.directive('stRatio', ->
  link: (scope, element, attr) ->
    ratio = +(attr.stRatio)
    element.css 'width', ratio + '%'
)

ev.directive('aboutEvenn', ->
  templateUrl: 'about.html'
  link: (scope) -> scope.isDirective = true
)

ev.directive('attendeeTable', [
  '$rootScope'
  ($rootScope) ->
    scope:
      attendees: '='
      highlightId: '='
      events: '='
    templateUrl: 'attendee-table.html'
    link: (scope, element, attr) ->
      scope.eventIds = Object.keys(scope.events)
      scope.tableHeight = if window.innerHeight then "#{window.innerHeight - 40}px" else '350px'
      scope.columnWidth = (80 / scope.eventIds.length) - 0.1
      # scope.rsvpMeta = rsvpMeta

      scope.getScore = (attendee) ->
        return attendee.score if attendee.score
        attendee.score = _.reduce(scope.eventIds,
        (result, eventId, index) ->
          rsvpScore = $rootScope.rsvpMeta.points[attendee.events[eventId]]
          if rsvpScore
            i = Math.pow((index+2), 2)
            result + 10000 + (i*100) + (rsvpScore*i)
          else
            result
        , 0)
])

ev.directive('eventCard', ->
  templateUrl: 'event-card.html'
  scope:
    event: '='
)
