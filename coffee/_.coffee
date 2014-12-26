Chart.defaults.global.responsive = true

ev = angular.module('evenn', [
  'ngRoute'
  'ngAnimate'
  'mgcrea.ngStrap'
  'facebook'
  'smart-table'
  'angulartics'
  'angulartics.google.analytics'
  'ngIntercom'
  'chart.js'
])

ev.constant('paginate', (array, pageSize, pageNumber) ->
  array.slice(pageSize * pageNumber, pageSize * (pageNumber + 1))
)
