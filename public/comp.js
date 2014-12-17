var ev;

ev = angular.module('evenn', ['ngRoute', 'ngAnimate', 'mgcrea.ngStrap', 'facebook', 'smart-table', 'angulartics', 'angulartics.google.analytics']);

var ev;

ev = angular.module('evenn');

ev.controller('MainCtrl', [
  '$scope', '$http', '$location', 'Facebook', function($scope, $http, $location, Facebook) {
    var bindRedirector, goingToPath;
    $scope.user = {};
    goingToPath = $location.url();
    $location.url('/loading');
    Facebook.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        return Facebook.api('/me', function(response) {
          $scope.user.fb = response;
          $location.url('/select');
          return bindRedirector();
        });
      } else {
        $location.url('/login');
        return bindRedirector();
      }
    });
    return bindRedirector = function() {
      return $scope.$on('$locationChangeStart', function(e) {
        if ($scope.user.fb) {
          if ($location.url() !== '/select' && !$scope.user.events) {
            return $location.url('/select');
          }
        } else {
          if (!_.contains(['/login', '/loading'], $location.url())) {
            return $location.url('/login');
          }
        }
      });
    };
  }
]);

ev.controller('LoginCtrl', [
  '$scope', '$http', '$location', 'Facebook', function($scope, $http, $location, Facebook) {
    return $scope.login = function() {
      return Facebook.login(function(response) {
        if (response.status === 'connected') {
          return $location.url('/select');
        }
      }, {
        scope: 'user_events'
      });
    };
  }
]);

ev.controller('SelectEventsCtrl', [
  '$scope', '$location', '$timeout', '$analytics', 'Facebook', 'FbEvent', 'UserStore', function($scope, $location, $timeout, $analytics, Facebook, FbEvent, UserStore) {
    var selectedEvents;
    Facebook.api('/me/events/attending', {
      limit: 100
    }, function(events) {
      return $scope.availableEvents = events.data;
    });
    selectedEvents = function() {
      return _.filter($scope.availableEvents, 'selected');
    };
    $scope.updateSelectedEventCount = function() {
      return $scope.selectedEventCount = selectedEvents().length;
    };
    return $scope.analyseEvents = function() {
      var loadedCount;
      selectedEvents = selectedEvents();
      $scope.loadingMessage = "Loading " + selectedEvents.length + " events...";
      loadedCount = 0;
      return async.reduce(selectedEvents, {}, function(memo, event, cb) {
        return memo[event.id] = new FbEvent(event, function() {
          loadedCount += 1;
          $scope.loadingMessage = "Loaded " + loadedCount + " of " + selectedEvents.length;
          return cb(null, memo);
        });
      }, function(err, events) {
        console.log(events);
        $scope.user.events = events;
        $scope.user.eventIds = Object.keys(events);
        $scope.loadingMessage = "Event download complete. Please wait...";
        return $timeout(function() {
          var label;
          label = "" + $scope.user.eventIds.length + "e" + (_.size(UserStore.users)) + "u";
          console.log(label);
          $analytics.eventTrack('analyse', {
            category: 'interesting',
            label: label
          });
          $location.url('/');
          return $scope.user.eventsReady = true;
        }, 1000);
      });
    };
  }
]);

ev.controller('EventsHomeCtrl', ['$scope', function($scope) {}]);

ev.controller('TableCtrl', [
  '$scope', '$routeParams', 'UserStore', function($scope, $routeParams, UserStore) {
    var rsvpStatuses;
    rsvpStatuses = {
      attending: 16,
      unsure: 15,
      declined: 14,
      not_replied: 9
    };
    $scope.rsvpMeta = {
      colors: {
        attending: 'success',
        declined: 'danger',
        unsure: 'warning',
        not_replied: 'active'
      },
      words: {
        attending: 'Going',
        declined: 'Declined',
        unsure: 'Maybe',
        not_replied: 'Invited'
      }
    };
    $scope.highlightId = $routeParams.highlight;
    $scope.innerHeight = window.innerHeight ? "" + (window.innerHeight - 150) + "px" : 500;
    $scope.columnWidth = (80 / $scope.user.eventIds.length) - 0.1;
    $scope.attendees = _.values(UserStore.users);
    return $scope.getScore = function(attendee) {
      return _.reduce($scope.user.eventIds, function(result, eventId, index) {
        var i, rsvpScore;
        rsvpScore = rsvpStatuses[attendee.events[eventId]];
        if (rsvpScore) {
          i = Math.pow(index + 2, 2);
          return result + 10000 + (i * 100) + (rsvpScore * i);
        } else {
          return result;
        }
      }, 0);
    };
  }
]);

ev.controller('VennCtrl', ['$scope', function($scope) {}]);

ev.controller('GenderRatiosCtrl', ['$scope', function($scope) {}]);

var ev;

ev = angular.module('evenn');

ev.directive("loader", [
  function() {
    return {
      restrict: "AE",
      replace: true,
      template: "<div class=\"spinner\">\n  <div class=\"rect1\"></div>\n  <div class=\"rect2\"></div>\n  <div class=\"rect3\"></div>\n  <div class=\"rect4\"></div>\n  <div class=\"rect5\"></div>\n</div>"
    };
  }
]);

ev.directive("stRatio", function() {
  return {
    link: function(scope, element, attr) {
      var ratio;
      ratio = +attr.stRatio;
      return element.css("width", ratio + "%");
    }
  };
});

var ev;

ev = angular.module('evenn');

ev.config([
  '$routeProvider', '$tooltipProvider', '$modalProvider', '$popoverProvider', '$dropdownProvider', '$analyticsProvider', 'FacebookProvider', function($routeProvider, $tooltipProvider, $modalProvider, $popoverProvider, $dropdownProvider, $analyticsProvider, FacebookProvider) {
    $routeProvider.when('/', {
      templateUrl: 'events_home.html',
      controller: 'EventsHomeCtrl'
    }).when('/venn', {
      templateUrl: 'venn.html',
      controller: 'VennCtrl'
    }).when('/genders', {
      templateUrl: 'genders.html',
      controller: 'GenderRatiosCtrl'
    }).when('/table', {
      templateUrl: 'table.html',
      controller: 'TableCtrl'
    }).when('/loading', {
      templateUrl: 'loading.html'
    }).when('/select', {
      templateUrl: 'select.html',
      controller: 'SelectEventsCtrl'
    }).when('/login', {
      templateUrl: 'login.html',
      controller: 'LoginCtrl'
    });
    angular.extend($tooltipProvider.defaults, {
      trigger: 'hover',
      placement: 'bottom',
      container: 'body'
    });
    angular.extend($modalProvider.defaults, {
      container: 'body',
      backdropAnimation: null
    });
    angular.extend($popoverProvider.defaults, {
      container: 'body',
      animation: null
    });
    angular.extend($dropdownProvider.defaults, {
      animation: null
    });
    return FacebookProvider.init({
      appId: '316035781927497',
      version: 'v2.2'
    });
  }
]);

ev.run([
  '$rootScope', '$location', function($rootScope, $location) {
    return $rootScope.location = $location;
  }
]);

ev.filter('cap', function() {
  return function(input, scope) {
    if (input !== null) {
      input = input.toLowerCase();
      return input.substring(0, 1).toUpperCase() + input.substring(1);
    }
  };
});

var ev;

ev = angular.module('evenn');

ev.service('UserStore', [
  function() {
    var User, store;
    User = (function() {
      function User(fbObj) {
        this.id = fbObj.id;
        this.name = fbObj.name;
        this.first_name = fbObj.first_name;
        this.link = fbObj.link;
        this.picture_url = fbObj.picture.data.url;
        this.events = {};
      }

      User.prototype.addRsvp = function(id, rsvp) {
        return this.events[id] = rsvp;
      };

      return User;

    })();
    return store = {
      users: {},
      addUserObjByEvent: function(eventId, userObj) {
        var userInstance;
        userInstance = this.users[userObj.id];
        if (!userInstance) {
          userInstance = new User(userObj);
          this.users[userObj.id] = userInstance;
        }
        userInstance.addRsvp(eventId, userObj.rsvp_status);
        return userInstance;
      }
    };
  }
]);

ev.service('FbEvent', [
  'Facebook', 'UserStore', function(Facebook, UserStore) {
    var FbEvent;
    return FbEvent = (function() {
      function FbEvent(fbObj, cb) {
        var self;
        self = this;
        Facebook.api("/" + fbObj.id, {
          fields: 'id,description,location,name,owner,privacy,start_time,timezone,updated_time,venue,cover'
        }, function(res) {
          _.merge(self, res);
          self.invited = [];
          return Facebook.api("/" + self.id + "/invited", {
            fields: 'id,first_name,name,link,picture,rsvp_status,gender',
            limit: 1000
          }, function(res) {
            self.invited = _.map(res.data, function(userObj) {
              return UserStore.addUserObjByEvent(self.id, userObj);
            });
            return cb(self);
          });
        });
      }

      return FbEvent;

    })();
  }
]);

var ev = angular.module('evenn');

// http://stackoverflow.com/a/13320016/1520847
// Create an AngularJS service called debounce
ev.factory('debounce', ['$timeout','$q', function($timeout, $q) {
  // The service is actually this function, which we call with the func
  // that should be debounced and how long to wait in between calls
  return function debounce(func, wait, immediate) {
    var timeout;
    // Create a deferred object that will be resolved when we need to
    // actually call the func
    var deferred = $q.defer();
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if(!immediate) {
          deferred.resolve(func.apply(context, args));
          deferred = $q.defer();
        }
      };
      var callNow = immediate && !timeout;
      if ( timeout ) {
        $timeout.cancel(timeout);
      }
      timeout = $timeout(later, wait);
      if (callNow) {
        deferred.resolve(func.apply(context,args));
        deferred = $q.defer();
      }
      return deferred.promise;
    };
  };
}]);
