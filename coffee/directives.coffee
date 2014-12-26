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
  'paginate'
  ($rootScope, paginate) ->
    scope:
      attendees: '='
      highlightId: '='
      events: '='
    templateUrl: 'attendee-table.html'
    link: (scope, element, attr) ->
      scope.eventIds = $rootScope.user.eventIds
      tableHeight = if window.innerHeight then window.innerHeight - 80 else 350
      scope.tableHeightStr = "#{tableHeight}px"
      scope.columnWidth = (75 / scope.eventIds.length) - 0.1
      perPage = Math.floor((tableHeight + 200) / 31)

      currentPage = -1
      getNextPage = ->
        paginate(
          scope.attendees,
          perPage,
          currentPage += 1
        )
      scope.rowCollection = []
      addNextPage = ->
        if scope.attendees.length > scope.rowCollection.length
          scope.rowCollection.push.apply(scope.rowCollection, getNextPage())
          scope.$apply()

      container = angular.element(element.find('tbody')[0])
      lengthThreshold = 50
      lastRemaining = 9999
      container.bind "scroll", ->
        remaining = container[0].scrollHeight - (container[0].clientHeight + container[0].scrollTop)
        if remaining < lengthThreshold and (remaining - lastRemaining) < 0
          addNextPage()
        lastRemaining = remaining
      scope.rowCollection = getNextPage()

      scope.$watch("userSearch.name", (newValue) ->
        if newValue
          while scope.attendees.length > scope.rowCollection.length
            scope.rowCollection.push.apply(scope.rowCollection, getNextPage())
      )
])

ev.directive('eventCard', ->
  templateUrl: 'event-card.html'
  scope:
    event: '='
)
