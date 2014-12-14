var gulp = require('gulp');
var stylish = require('jshint-stylish');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var StreamQueue = require('streamqueue');
var coffee = require('gulp-coffee');
var coffeelint = require('gulp-coffeelint');
var gutil = require('gulp-util');
var connect = require('gulp-connect');

var fileLocations = {
  coffee: [
    "./coffee/*.coffee"
  ],
  js: [
    "./coffee/*.js"
  ],
  scss: ["./scss/*.scss"]
  // cssLibs: ["./assets/csslib/*.css"]
};

// Sass and css libs
gulp.task('css', function () {
  var sassStream = gulp.src(fileLocations.scss).pipe(sass());
  // var cssFiles = gulp.src('./assets/csslib/*.css');
  new StreamQueue({objectMode: true},
    // cssFiles,
    sassStream
  ).pipe(concat('comp.css'))
    .pipe(gulp.dest('./public'));
});
// Lint JS
// Frontend
gulp.task('front-lint', function() {
  gulp.src(fileLocations.coffee)
    .pipe(coffeelint({
      max_line_length: {
        value: 138
      }
    }))
    .pipe(coffeelint.reporter());
});

//Concat & Minify JS
gulp.task('ng-concat', function() {
  var coffeeStream = gulp.src(fileLocations.coffee).pipe(coffee({bare: true}).on('error', gutil.log));
  var jsStream = gulp.src(fileLocations.js);
  new StreamQueue({objectMode: true},
    coffeeStream,
    jsStream
  ).pipe(concat('comp.js'))
    // .pipe(gulp.dest('./dist'))
    // .pipe(rename('all.min.js'))
    // .pipe(uglify())
    .pipe(gulp.dest('./public'));
});

gulp.task('connect', function() {
  connect.server();
});

// Default
gulp.task('default', ['front-lint', 'ng-concat', 'css', 'connect'], function() {
  // Watch JS Files
  gulp.watch(fileLocations.coffee, ['front-lint', 'ng-concat']);
  gulp.watch(fileLocations.js, ['ng-concat']);
  gulp.watch(fileLocations.scss, ['css']);
});
