ev = angular.module('evenn')

ev.directive("loader", [->
  restrict: "AE"
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


ev.directive("stRatio", ->
  link: (scope, element, attr) ->
    ratio = +(attr.stRatio)
    element.css "width", ratio + "%"
)
