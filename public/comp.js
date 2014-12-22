var ev;

ev = angular.module('evenn', ['ngRoute', 'ngAnimate', 'mgcrea.ngStrap', 'facebook', 'smart-table', 'angulartics', 'angulartics.google.analytics', 'nvd3']);

var ev;

ev = angular.module('evenn');

ev.controller('MainCtrl', [
  '$window', '$scope', '$http', '$location', 'Facebook', function($window, $scope, $http, $location, Facebook) {
    $scope.goBack = function() {
      return $window.history.back();
    };
    return $scope.logout = function() {
      Facebook.logout();
      _.forEach(Object.keys($scope.user), function(k) {
        return $scope.user[k];
      });
      return $location.url("/login");
    };
  }
]);

ev.controller('LoginCtrl', [
  '$scope', '$http', '$location', '$alert', 'Facebook', function($scope, $http, $location, $alert, Facebook) {
    return $scope.login = function() {
      return Facebook.login(function(response) {
        var availablePermissions;
        availablePermissions = response.authResponse.grantedScopes.split(',');
        if (response.status === 'connected') {
          if (_.contains(availablePermissions, 'user_events') && _.contains(availablePermissions, 'rsvp_event')) {
            return Facebook.api('/me', function(response) {
              $scope.user.fb = response;
              return $location.url('/select');
            });
          } else {
            $scope.loginError = "Error logging in. All permissions must be accepted!";
          }
        } else {
          $scope.loginError = "There was a problem logging into Facebook!";
        }
        return Facebook.logout();
      }, {
        scope: 'user_events,rsvp_event',
        return_scopes: true,
        auth_type: 'rerequest'
      });
    };
  }
]);

ev.controller('SelectEventsCtrl', [
  '$scope', '$location', '$timeout', '$analytics', 'Facebook', 'FbEvent', 'UserStore', function($scope, $location, $timeout, $analytics, Facebook, FbEvent, UserStore) {
    var selectedEvents;
    $scope.user.events = null;
    $scope.user.eventIds = null;
    async.reduce(['attending', 'not_replied', 'maybe', 'declined'], [], function(memo, status, cb) {
      return Facebook.api("/me/events/" + status, {
        limit: 50,
        since: Math.round(new Date().getTime() / 1000) - 86400
      }, function(events) {
        return cb(null, memo.concat(events.data));
      });
    }, function(err, events) {
      $scope.availableEvents = events;
      return $analytics.eventTrack('events_select_length', {
        category: 'interesting',
        label: "" + events.length
      });
    });
    $scope.maxSelection = 5;
    selectedEvents = function() {
      return _.filter($scope.availableEvents, 'selected');
    };
    $scope.selectedEventCount = 0;
    $scope.updateSelectedEventCount = function() {
      return $scope.selectedEventCount = selectedEvents().length;
    };
    return $scope.analyseEvents = function() {
      var loadedCount;
      selectedEvents = selectedEvents().slice(0, $scope.maxSelection);
      if (!selectedEvents.length) {
        return;
      }
      $scope.loadingMessage = "Loading " + selectedEvents.length + " events...";
      loadedCount = 0;
      return async.reduce(selectedEvents, {}, function(memo, event, cb) {
        return memo[event.id] = new FbEvent(event, function() {
          loadedCount += 1;
          $scope.loadingMessage = "Loaded " + loadedCount + " of " + selectedEvents.length;
          return cb(null, memo);
        });
      }, function(err, events) {
        $scope.user.events = events;
        $scope.user.eventIds = Object.keys(events);
        $scope.loadingMessage = "Event download complete. Getting gender data...";
        return UserStore.getAllGenders(function(users) {
          $scope.loadingMessage = "Genders done. Counting shit...";
          _.forEach($scope.user.events, function(e) {
            return e.generateAllEventStats();
          });
          return $timeout(function() {
            var label;
            console.log($scope.user.events);
            label = "" + $scope.user.eventIds.length + "e" + (_.size(UserStore.users)) + "u";
            $analytics.eventTrack('analyse', {
              category: 'interesting',
              label: label
            });
            $location.url('/');
            return $scope.user.eventsReady = true;
          }, 1000);
        });
      });
    };
  }
]);

ev.controller('EventsHomeCtrl', ['$scope', function($scope) {}]);

ev.controller('TableCtrl', [
  '$scope', '$routeParams', 'UserStore', function($scope, $routeParams, UserStore) {
    $scope.highlightId = $routeParams.highlight;
    return $scope.attendees = _.values(UserStore.users);
  }
]);

ev.controller('VennCtrl', ['$scope', function($scope) {}]);

ev.controller('GenderRatioIndexCtrl', ['$scope', 'UserStore', function($scope, UserStore) {}]);

var ev;

ev = angular.module('evenn');

ev.directive('loader', [
  function() {
    return {
      restrict: 'AE',
      replace: true,
      template: "<div class=\"spinner\">\n  <div class=\"rect1\"></div>\n  <div class=\"rect2\"></div>\n  <div class=\"rect3\"></div>\n  <div class=\"rect4\"></div>\n  <div class=\"rect5\"></div>\n</div>"
    };
  }
]);

ev.directive('genderRatio', [
  function() {
    return {
      restrict: 'AE',
      scope: {
        counts: "="
      },
      template: "<span>\n  <span class=\"text-danger\">{{counts.ratio}} girls</span> to\n  <span class=\"text-info\">1 guy</span>\n</span>"
    };
  }
]);

ev.directive('genderCounts', [
  function() {
    return {
      restrict: 'AE',
      scope: {
        counts: "="
      },
      template: "<span>\n  <span class=\"text-danger\">{{counts.f}} <i class=\"fa fa-female\"></i></span>\n  <span class=\"text-info\">{{counts.m}} <i class=\"fa fa-male\"></i></span>\n  <span ng-show=\"counts.n\">{{counts.n}} <i class=\"fa fa-user\"></i></span>\n</span>"
    };
  }
]);

ev.directive('stRatio', function() {
  return {
    link: function(scope, element, attr) {
      var ratio;
      ratio = +attr.stRatio;
      return element.css('width', ratio + '%');
    }
  };
});

ev.directive('aboutEvenn', function() {
  return {
    templateUrl: 'about.html',
    link: function(scope) {
      return scope.isDirective = true;
    }
  };
});

ev.directive('attendeeTable', [
  '$rootScope', function($rootScope) {
    return {
      scope: {
        attendees: '=',
        highlightId: '=',
        events: '='
      },
      templateUrl: 'attendee-table.html',
      link: function(scope, element, attr) {
        scope.eventIds = Object.keys(scope.events);
        scope.tableHeight = window.innerHeight ? "" + (window.innerHeight - 40) + "px" : '350px';
        scope.columnWidth = (80 / scope.eventIds.length) - 0.1;
        return scope.getScore = function(attendee) {
          if (attendee.score) {
            return attendee.score;
          }
          return attendee.score = _.reduce(scope.eventIds, function(result, eventId, index) {
            var i, rsvpScore;
            rsvpScore = $rootScope.rsvpMeta.points[attendee.events[eventId]];
            if (rsvpScore) {
              i = Math.pow(index + 2, 2);
              return result + 10000 + (i * 100) + (rsvpScore * i);
            } else {
              return result;
            }
          }, 0);
        };
      }
    };
  }
]);

ev.directive('eventCard', function() {
  return {
    templateUrl: 'event-card.html',
    scope: {
      event: '='
    }
  };
});

var ev;

ev = angular.module('evenn');

ev.config([
  '$routeProvider', '$tooltipProvider', '$modalProvider', '$popoverProvider', '$dropdownProvider', '$httpProvider', 'FacebookProvider', function($routeProvider, $tooltipProvider, $modalProvider, $popoverProvider, $dropdownProvider, $httpProvider, FacebookProvider) {
    $routeProvider.when('/', {
      templateUrl: 'events-home.html',
      controller: 'EventsHomeCtrl'
    }).when('/venn', {
      templateUrl: 'venn.html',
      controller: 'VennCtrl'
    }).when('/genders', {
      templateUrl: 'gender-ratio-index.html',
      controller: 'GenderRatioIndexCtrl'
    }).when('/genders/:id', {
      templateUrl: 'gender-ratio-show.html',
      controller: 'GenderRatioShowCtrl'
    }).when('/table', {
      templateUrl: 'table.html',
      controller: 'TableCtrl'
    }).when('/select', {
      templateUrl: 'select.html',
      controller: 'SelectEventsCtrl'
    }).when('/login', {
      templateUrl: 'login.html',
      controller: 'LoginCtrl'
    }).when('/about', {
      templateUrl: 'about.html'
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
    FacebookProvider.init({
      appId: '316035781927497',
      version: 'v2.2'
    });
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    return $httpProvider.defaults.headers.patch = {};
  }
]);

ev.run([
  '$rootScope', '$location', '$route', '$timeout', 'Facebook', function($rootScope, $location, $route, $timeout, Facebook) {
    var delayedLoad, noAuthRoutes;
    $rootScope.rsvpMeta = {
      colors: {
        attending: 'success',
        unsure: 'warning',
        declined: 'danger',
        not_replied: 'active'
      },
      words: {
        attending: 'Going',
        unsure: 'Maybe',
        declined: 'Declined',
        not_replied: 'Not replied'
      },
      points: {
        attending: 16,
        unsure: 15,
        declined: 14,
        not_replied: 9
      }
    };
    $rootScope.user = {};
    $rootScope.location = $location;
    noAuthRoutes = ['/login', '/about'];
    delayedLoad = function() {
      return $timeout((function() {
        return $rootScope.evennLoaded = true;
      }), 1000);
    };
    return $rootScope.$on('$locationChangeStart', function(e, next, current) {
      var url;
      url = $location.url();
      if (_.contains(noAuthRoutes, url)) {
        delayedLoad();
      } else if ($rootScope.user.fb) {
        if (!$rootScope.user.events) {
          delayedLoad();
          return $location.url('/select');
        }
      } else {
        e.preventDefault();
        return Facebook.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            return Facebook.api('/me', function(response) {
              $rootScope.user.fb = response;
              $location.url('/select');
              $route.reload();
              return delayedLoad();
            });
          } else {
            $location.url('/login');
            $route.reload();
            return delayedLoad();
          }
        });
      }
    });
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

ev.service('genders', [
  '$http', function($http) {
    return {
      getBulk: function(names, cb) {
        return $http({
          method: 'POST',
          url: 'http://gender.rory.ie/bulk',
          data: {
            names: names
          }
        }).success(function(data) {
          return cb(data.names);
        });
      }
    };
  }
]);

ev.service('UserStore', [
  'genders', function(genders) {
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
      loadedGenders: false,
      addUserObjByEvent: function(eventId, userObj) {
        var userInstance;
        userInstance = this.users[userObj.id];
        if (!userInstance) {
          userInstance = new User(userObj);
          this.users[userObj.id] = userInstance;
        }
        userInstance.addRsvp(eventId, userObj.rsvp_status);
        return userInstance;
      },
      getAllGenders: function(cb) {
        var namesToIds, self;
        self = this;
        if (this.loadedGenders) {
          return cb(self.users);
        }
        namesToIds = _.reduce(this.users, function(memo, user) {
          var name;
          if (!user.first_name) {
            return;
          }
          name = user.first_name.toLowerCase().trim().split(' ')[0];
          if (!memo[name]) {
            memo[name] = [];
          }
          memo[name].push(user.id);
          return memo;
        }, {});
        return genders.getBulk(Object.keys(namesToIds), function(namesToGenders) {
          _.forEach(namesToGenders, function(gender, name) {
            return _.forEach(namesToIds[name], function(id) {
              return self.users[id].gender = gender;
            });
          });
          self.loadedGenders = true;
          return cb(self.users);
        });
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
        this.rsvpTypes = ['attending', 'declined', 'unsure', 'not_replied'];
        self = this;
        Facebook.api("/" + fbObj.id, {
          fields: 'id,description,location,name,owner,privacy,start_time,timezone,updated_time,venue,cover'
        }, function(res) {
          _.merge(self, res);
          self.invited = [];
          return Facebook.api("/" + self.id + "/invited", {
            fields: 'id,first_name,name,link,picture,rsvp_status,gender',
            limit: 5000
          }, function(res) {
            self.invited = _.map(res.data, function(userObj) {
              return UserStore.addUserObjByEvent(self.id, userObj);
            });
            self.invitedCount = self.invited.length;
            return cb(self);
          });
        });
      }

      FbEvent.prototype._usersWithRsvp = function(rsvp) {
        var self;
        self = this;
        return _.filter(this.invited, function(user) {
          return user.events[self.id] === rsvp;
        });
      };

      FbEvent.prototype._addRsvpGroups = function() {
        var self;
        self = this;
        return _.forEach(this.rsvpTypes, function(rsvp) {
          self[rsvp] = self._usersWithRsvp(rsvp);
          return self[rsvp + 'Count'] = self[rsvp].length;
        });
      };

      FbEvent.prototype._genderCountsFor = function(list) {
        var gc;
        gc = {
          f: 0,
          m: 0,
          n: 0
        };
        _.assign(gc, _.countBy(list, 'gender'));
        gc.isFemaleToMale = gc.f >= gc.m;
        if (gc.f === 0 || gc.m === 0) {
          gc.ratio = 0;
        } else {
          gc.ratio = gc.f / gc.m;
          if (!gc.isFemaleToMale) {
            gc.ratio = 1 / gc.ratio;
          }
          gc.ratio = Math.round(gc.ratio * 100) / 100;
        }
        return gc;
      };

      FbEvent.prototype.generateAllEventStats = function() {
        var self;
        self = this;
        this._addRsvpGroups();
        return this.genderCounts = _.reduce(['invited', 'attending'], function(memo, rsvp) {
          memo[rsvp] = self._genderCountsFor(self[rsvp]);
          return memo;
        }, {});
      };

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
