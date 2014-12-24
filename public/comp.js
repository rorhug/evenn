var ev;

Chart.defaults.global.responsive = true;

ev = angular.module('evenn', ['ngRoute', 'ngAnimate', 'mgcrea.ngStrap', 'facebook', 'smart-table', 'angulartics', 'angulartics.google.analytics', 'ngIntercom', 'chart.js']);

window.evennConfig = {
  ga_id: 'UA-38398315-11',
  fb_app_id: '316035781927497',
  intercom_app_id: 'as2avokq'
};

var ev;

ev = angular.module('evenn');

ev.controller('MainCtrl', [
  '$window', '$scope', '$http', '$location', 'Facebook', 'UserStore', function($window, $scope, $http, $location, Facebook, UserStore) {
    $scope.goBack = function() {
      return $window.history.back();
    };
    $scope.logout = function() {
      Facebook.logout();
      _.forEach(Object.keys($scope.user), function(k) {
        return delete $scope.user[k];
      });
      UserStore.removeAll();
      return $location.url("/login");
    };
    return $scope.changeEvents = function() {
      _.forEach(_.without(Object.keys($scope.user), 'fb'), function(k) {
        return delete $scope.user[k];
      });
      UserStore.removeAll();
      return $location.url('/select');
    };
  }
]);

ev.controller('LoginCtrl', [
  '$scope', '$http', '$location', '$alert', 'Facebook', function($scope, $http, $location, $alert, Facebook) {
    var neededPermissions;
    neededPermissions = ['user_events', 'rsvp_event', 'email'];
    return $scope.login = function() {
      return Facebook.login(function(response) {
        var availablePermissions;
        availablePermissions = response.authResponse.grantedScopes.split(',');
        if (response.status === 'connected') {
          if (_.without.apply(_, [neededPermissions].concat(availablePermissions)).length === 0) {
            return $scope.loadMe(function() {
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
        scope: neededPermissions.join(','),
        return_scopes: true,
        auth_type: 'rerequest'
      });
    };
  }
]);

ev.controller('SelectEventsCtrl', [
  '$scope', '$location', '$timeout', '$analytics', '$intercom', 'Facebook', 'FbEvent', 'UserStore', function($scope, $location, $timeout, $analytics, $intercom, Facebook, FbEvent, UserStore) {
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
      return $intercom.trackEvent('events_select_length', {
        event_count: events.length
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
      var addLoadingLine, loadedCount;
      $scope.loadingMessage = "-*- START ANALYSIS -*-";
      addLoadingLine = function(l) {
        return $scope.loadingMessage += "\n" + l;
      };
      selectedEvents = selectedEvents().slice(0, $scope.maxSelection);
      if (!selectedEvents.length) {
        return;
      }
      addLoadingLine("Loading " + selectedEvents.length + " events...");
      loadedCount = 0;
      return async.reduce(selectedEvents, {}, function(memo, event, cb) {
        return memo[event.id] = new FbEvent(event, function() {
          loadedCount += 1;
          addLoadingLine("Loaded " + loadedCount + " of " + selectedEvents.length + " ('" + event.name + "')");
          return cb(null, memo);
        });
      }, function(err, events) {
        $scope.user.events = events;
        $scope.user.eventIds = Object.keys(events);
        addLoadingLine("Event download complete. Getting gender data...");
        return UserStore.getAllGenders(function(users) {
          addLoadingLine("Genders done. Counting shit...");
          _.forEach($scope.user.events, function(e) {
            return e.generateAllEventStats();
          });
          addLoadingLine("-*- ANALYSIS COMPLETE -*-\nPlease wait...");
          return $timeout(function() {
            $intercom.trackEvent('analyse', {
              event_count: $scope.user.eventIds.length,
              total_facebook_users: _.size(UserStore.users)
            });
            $location.url('/');
            return $scope.user.eventsReady = true;
          }, 2000);
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

ev.controller('GenderRatioIndexCtrl', [
  '$scope', 'UserStore', '$intercom', function($scope, UserStore, $intercom) {
    return $intercom.trackEvent('view_gender_ratio_index', {
      event_count: $scope.user.eventIds.length
    });
  }
]);

ev.controller('GenderRatioShowCtrl', [
  '$scope', '$routeParams', 'UserStore', '$intercom', function($scope, $routeParams, UserStore, $intercom) {
    $scope.event = $scope.user.events[$routeParams.id];
    return $intercom.trackEvent('view_gender_ratio_show', {
      female_invited_count: $scope.event.genderCounts.invited.f,
      male_invited_count: $scope.event.genderCounts.invited.m,
      neutral_invited_count: $scope.event.genderCounts.invited.n
    });
  }
]);

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
      template: "<span>\n  <span ng-class=\"{'girl': counts.isFemaleToMale, 'guy': !counts.isFemaleToMale}\">\n    {{counts.ratio}} {{counts.isFemaleToMale ? 'girls' : 'guys'}}\n  </span> to\n  <span ng-class=\"{'girl': !counts.isFemaleToMale, 'guy': counts.isFemaleToMale}\">\n    1 {{counts.isFemaleToMale ? 'guy' : 'girl'}}\n  </span>\n</span>"
    };
  }
]);

ev.directive('genderCounts', [
  function() {
    return {
      restrict: 'AE',
      scope: {
        counts: "=",
        rsvp: "=",
        percentages: "=",
        newLines: '='
      },
      link: function(scope) {
        return scope.gTypes = ['f', 'm', 'n'];
      },
      template: "<span>\n  <span ng-repeat=\"g in gTypes\" ng-class=\"[$root.genderMeta.names[g]]\"\n    ng-show=\"counts[g]\" bs-tooltip title=\"{{$root.genderMeta.capNames[g]}}\">\n    <strong>{{counts[g]}}</strong>\n    <span ng-if=\"percentages\">({{counts[g + 'Cent']}}%)</span>\n    <i ng-class=\"['fa', $root.genderMeta.icons[g]]\"></i>\n    <br ng-if=\"newLines\">\n  </span>\n</span>"
    };
  }
]);

ev.directive('genderRatioPie', [
  '$timeout', function($timeout) {
    return {
      template: "<div class=\"ratio-chart\">\n  <h3 class=\"text-center\">\n    <gender-ratio counts=\"counts[selectedRsvpType]\"></gender-ratio>\n  </h3>\n  <p ng-hide=\"chartData.length\" class=\"text-center\">Loading chart...</p>\n  <canvas ng-if=\"chartData.length\" class=\"chart chart-doughnut\"\n    data=\"chartData\" labels=\"labels\" colours=\"colours\"></canvas>\n  <div class=\"btn-group text-center\" ng-model=\"selectedRsvpType\" bs-radio-group>\n    <label class=\"btn btn-default\"><input type=\"radio\" value=\"attending\">Going</label>\n    <label class=\"btn btn-default\"><input type=\"radio\" value=\"invited\">All invited</label>\n  </div>\n</div>",
      scope: {
        counts: '='
      },
      link: function(scope) {
        scope.colours = [
          {
            fillColor: "rgba(182,41,30,0.2)",
            strokeColor: "rgba(182,41,30,1)",
            pointColor: "rgba(182,41,30,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(182,41,30,0.8)"
          }, {
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,0.8)"
          }, {
            fillColor: "rgba(8,72,149,0.2)",
            strokeColor: "rgba(8,72,149,1)",
            pointColor: "rgba(8,72,149,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(8,72,149,0.8)"
          }
        ];
        scope.labels = ['Female', 'Neutral first name', 'Male'];
        scope.chartData = [];
        scope.$watch('selectedRsvpType', function(newValue) {
          scope.chartData = [];
          return $timeout(function() {
            return _.forEach(['f', 'n', 'm'], function(gender, index) {
              return scope.chartData[index] = scope.counts[newValue][gender];
            });
          }, 200);
        });
        return scope.selectedRsvpType = 'attending';
      }
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

ev.directive('aboutGenderRatios', function() {
  return {
    templateUrl: 'about-gender-ratios.html'
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
        scope.tableHeight = window.innerHeight ? "" + (window.innerHeight - 80) + "px" : '350px';
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
  '$routeProvider', '$tooltipProvider', '$dropdownProvider', '$httpProvider', '$intercomProvider', 'FacebookProvider', function($routeProvider, $tooltipProvider, $dropdownProvider, $httpProvider, $intercomProvider, FacebookProvider) {
    $routeProvider.when('/', {
      templateUrl: 'events-home.html',
      controller: 'EventsHomeCtrl'
    }).when('/venn', {
      templateUrl: 'venn.html',
      controller: 'VennCtrl'
    }).when('/genders', {
      templateUrl: 'gender-ratio-index.html',
      controller: 'GenderRatioIndexCtrl'
    }).when('/events/:id/genders', {
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
    angular.extend($dropdownProvider.defaults, {
      animation: null
    });
    FacebookProvider.init({
      appId: window.evennConfig.fb_app_id,
      version: 'v2.2'
    });
    if (!window.evennIsLocalhost) {
      $intercomProvider.appID(window.evennConfig.intercom_app_id);
      $intercomProvider.asyncLoading(true);
    }
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    return $httpProvider.defaults.headers.patch = {};
  }
]);

ev.run([
  '$rootScope', '$location', '$route', '$timeout', '$intercom', 'Facebook', function($rootScope, $location, $route, $timeout, $intercom, Facebook) {
    var delayedLoad, noAuthRoutes;
    $rootScope.rsvpMeta = {
      colors: {
        attending: 'success',
        unsure: 'warning',
        declined: 'danger',
        not_replied: 'active'
      },
      words: {
        invited: 'All invited',
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
    $rootScope.genderMeta = {
      names: {
        m: 'male',
        f: 'female',
        n: 'neutral'
      },
      capNames: {
        m: 'Male',
        f: 'Female',
        n: 'Neutral first-name'
      },
      icons: {
        m: 'fa-male',
        f: 'fa-female',
        n: 'fa-user'
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
    $rootScope.loadMe = function(cb) {
      return Facebook.api('/me', {
        fields: 'id,email,name,first_name,gender,timezone,link,picture'
      }, function(res) {
        $rootScope.user.fb = res;
        if (!window.evennIsLocalhost) {
          $intercom.boot({
            user_id: res.id,
            email: res.email,
            name: res.name,
            gender: res.gender,
            link: res.link
          });
        }
        return cb();
      });
    };
    $rootScope.$on('$locationChangeStart', function(e, next, current) {
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
        return Facebook.getLoginStatus(function(res) {
          if (res.status === 'connected') {
            return $rootScope.loadMe(function() {
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
    return $rootScope.$on('$locationChangeSuccess', function(e, next, current) {
      return $intercom.update();
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
      },
      removeAll: function() {
        var self;
        self = this;
        return _.forEach(Object.keys(this.users), function(id) {
          return delete self.users[id];
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
        var gc, self;
        self = this;
        gc = {
          f: 0,
          m: 0,
          n: 0
        };
        _.assign(gc, _.countBy(list, 'gender'));
        if (gc.f === 0) {
          gc.ratio = 0;
          gc.isFemaleToMale = true;
        } else if (gc.m === 0) {
          gc.ratio = 0;
          gc.isFemaleToMale = false;
        } else {
          gc.isFemaleToMale = gc.f >= gc.m;
          gc.ratio = gc.f / gc.m;
          if (!gc.isFemaleToMale) {
            gc.ratio = 1 / gc.ratio;
          }
          gc.ratio = Math.round(gc.ratio * 100) / 100;
        }
        _.forEach(['f', 'm', 'n'], function(gender) {
          return gc["" + gender + "Cent"] = Math.round((gc[gender] / self.invitedCount) * 1000) / 10;
        });
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
