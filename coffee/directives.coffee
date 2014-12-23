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
      <span ng-class="{'girl': counts.isFemaleToMale, 'guy': !counts.isFemaleToMale}">
        {{counts.ratio}} {{counts.isFemaleToMale ? 'girls' : 'guys'}}
      </span> to
      <span ng-class="{'girl': !counts.isFemaleToMale, 'guy': counts.isFemaleToMale}">
        1 {{counts.isFemaleToMale ? 'guy' : 'girl'}}
      </span>
    </span>
  """
])

ev.directive('genderCounts', [->
  restrict: 'AE'
  scope:
    counts: "="
    rsvp: "="
    percentages: "="
    newLines: '='
  link: (scope) ->
    scope.gTypes = ['f', 'm', 'n']
  template: """
    <span>
      <span ng-repeat="g in gTypes" ng-class="[$root.genderMeta.names[g]]"
        ng-show="counts[g]" bs-tooltip title="{{$root.genderMeta.capNames[g]}}">
        <strong>{{counts[g]}}</strong>
        <span ng-if="percentages">({{counts[g + 'Cent']}}%)</span>
        <i ng-class="['fa', $root.genderMeta.icons[g]]"></i>
        <br ng-if="newLines">
      </span>
    </span>
  """
])

ev.directive('genderRatioPie', [
  '$timeout'
  ($timeout) ->
    template: """
      <div class="ratio-chart">
        <h3 class="text-center">
          <gender-ratio counts="counts[selectedRsvpType]"></gender-ratio>
        </h3>
        <p ng-hide="chartData.length" class="text-center">Loading chart...</p>
        <canvas ng-if="chartData.length" class="chart chart-doughnut"
          data="chartData" labels="labels" colours="colours"></canvas>
        <div class="btn-group text-center" ng-model="selectedRsvpType" bs-radio-group>
          <label class="btn btn-default"><input type="radio" value="attending">Going</label>
          <label class="btn btn-default"><input type="radio" value="invited">All invited</label>
        </div>
      </div>
    """
    scope:
      counts: '='
    link: (scope) ->
      scope.colours = [
          fillColor: "rgba(182,41,30,0.2)",
          strokeColor: "rgba(182,41,30,1)",
          pointColor: "rgba(182,41,30,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(182,41,30,0.8)"
        ,
          fillColor: "rgba(220,220,220,0.2)",
          strokeColor: "rgba(220,220,220,1)",
          pointColor: "rgba(220,220,220,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(220,220,220,0.8)"
        ,
          fillColor: "rgba(8,72,149,0.2)",
          strokeColor: "rgba(8,72,149,1)",
          pointColor: "rgba(8,72,149,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(8,72,149,0.8)"
      ]
      scope.labels = ['Female', 'Neutral first name', 'Male']
      scope.chartData = []
      scope.$watch('selectedRsvpType', (newValue) ->
        scope.chartData = []
        $timeout(->
          _.forEach(['f', 'n', 'm'], (gender, index) ->
            scope.chartData[index] = scope.counts[newValue][gender]
          )
        , 200)
      )
      scope.selectedRsvpType = 'attending'
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

ev.directive('aboutGenderRatios', ->
  templateUrl: 'about-gender-ratios.html'
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
      scope.tableHeight = if window.innerHeight then "#{window.innerHeight - 80}px" else '350px'
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
