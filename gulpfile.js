// VARIABLES
var gulp = require('gulp');
var gutil = require('gulp-util');
var merge = require('merge-stream');

var bower = require('gulp-bower');
var filter = require('gulp-filter');
var mainBowerFiles = require('main-bower-files');
var del = require('del');

var fs = require('fs');

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');
var npmCleanCSS = require('clean-css');
var wait = require('gulp-wait');

var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var newer = require('gulp-newer');
var imagemin = require('gulp-imagemin');

var sourcemaps = require('gulp-sourcemaps');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');

var gulpif = require('gulp-if');
var argv = require('yargs').argv;
var prod = !!(argv.prod);

// ASSET FOLDER PATHS
var paths = {
  images: {
    src: 'assets/src/images/',
    dest: 'assets/dist/images/',
  },
  scripts: {
    src: 'assets/src/js/',
    dest: 'assets/dist/js/'
  },
  styles: {
    src: 'assets/src/scss/',
    dest: 'assets/dist/css/'
  }
};

// ASSET FILES
var files = {
  // IMAGES
  images: paths.images.src + '/',
  // STYLES
  main: paths.styles.src + '/',
  // SCRIPTS
  scriptsMain: [
    paths.scripts.src + 'vendor/farbtastic.js',
    paths.scripts.src + 'vendor/ntc.js',
    paths.scripts.src + 'vendor/ntc_main.js',
    paths.scripts.src + 'vendor/modernizr.js',
    paths.scripts.src + 'vendor/tinycolor.js',
    paths.scripts.src + 'vendor/color-changer.js',
    paths.scripts.src + 'main.js'
  ],
  scriptsHomepage: [
    paths.scripts.src + 'homepage.js'
  ],
  scriptsSubpage: [
    paths.scripts.src + 'subpage.js'
  ]
};

// BOWER COMPONENTS
var framework = {
  bourbon: {
    src: 'bower_components/bourbon/app/assets/stylesheets/**/*',
    dest: paths.styles.src + 'vendor/bourbon/',
  },
  neat: {
    src: 'bower_components/neat/app/assets/stylesheets/**/*',
    dest: paths.styles.src + 'vendor/neat/'
  }
};

var siteURL = 'http://wsstarter.local';

// BROWSERSYNC
gulp.task('browser-sync', function () {
  var browserSyncFiles = ['*.{html,shtml,php,aspx,ascx,asp,inc}', '!assets/dist/css/critical/*.css', 'assets/dist/css/**/*.css', 'assets/dist/js/**/*.js', 'assets/dist/images/**/*.{png,gif,jpg,svg}'];
  browserSync.init(browserSyncFiles, {
    proxy: siteURL
  });
});

// STYLES
gulp.task('styles', function () {
  return gulp.src(files.main + '*.scss')
    .pipe(wait(500))
    .pipe(gulpif(!prod, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .on('error', notify.onError({
      message: 'Styles compiling failed'
    }))
    .pipe(autoprefixer({
      browsers: ['last 3 versions', 'IOS 8'],
      remove: false
    }))
    .pipe(gulpif(!prod, sourcemaps.write('.')))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(notify({
      message: 'Styles compiled successfully',
      onLast: true
    }));
});

// COMPRESS STYLES
gulp.task('compress-css', ['styles'], function () {
  return gulp.src(paths.styles.dest + '*.css')
    .pipe(sass().on('error', sass.logError))
    .on('error', notify.onError({
      message: 'Compress Styles Failed'
    }))
    .pipe(gulpif(prod, cleanCSS()))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(notify({
      message: 'CSS Compressed Successfully',
      onLast: true
    }));
});

// JS LINT
gulp.task('jslint', function () {
  var main = gulp.src(paths.scripts.src + 'main.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .on('error', notify.onError({
      message: 'Main JSLint failed'
    }));
  var home = gulp.src(paths.scripts.src + 'homepage.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .on('error', notify.onError({
      message: 'Homepage JSLint failed'
    }));
  var subpage = gulp.src(paths.scripts.src + 'subpage.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .on('error', notify.onError({
      message: 'Subpage JSLint failed'
    }));
  return merge(main, home, subpage);
});

// SCRIPTS
gulp.task('scripts', ['jslint'], function () {
  var main = gulp.src(files.scriptsMain)
    .pipe(gulpif(!prod, sourcemaps.init()))
    .pipe(concat('main.js'))
    .pipe(gulpif(prod, uglify().on('error', notify.onError({
      message: 'Main scripts failed'
    }))))
    .pipe(gulpif(!prod, sourcemaps.write('.')))
    .pipe(gulp.dest(paths.scripts.dest));
  var homepage = gulp.src(files.scriptsHomepage)
    .pipe(gulpif(!prod, sourcemaps.init()))
    .pipe(concat('homepage.js'))
    .pipe(gulpif(prod, uglify().on('error', notify.onError({
      message: 'Homepage scripts failed'
    }))))
    .pipe(gulpif(!prod, sourcemaps.write('.')))
    .pipe(gulp.dest(paths.scripts.dest));
  var subpage = gulp.src(files.scriptsSubpage)
    .pipe(gulpif(!prod, sourcemaps.init()))
    .pipe(concat('subpage.js'))
    .pipe(gulpif(prod, uglify().on('error', notify.onError({
      message: 'Subpage scripts failed'
    }))))
    .pipe(gulpif(!prod, sourcemaps.write('.')))
    .pipe(gulp.dest(paths.scripts.dest));

  return merge(main, homepage, subpage)
    .pipe(notify({
      message: 'Scripts compiled successfully',
      onLast: true
    }));
});

// IMAGES
gulp.task('images', function () {
  return gulp.src(paths.images.src + '**/*')
    .pipe(newer(paths.images.dest))
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.optipng({
        optimizationLevel: 5
      })
    ]))
    .pipe(gulp.dest(paths.images.dest))
    .on('error', gutil.log)
    .pipe(notify({
      message: 'Images copied successfully',
      onLast: true
    }));
});

// DEFAULT TASK
gulp.task('default', ['compress-css', 'scripts', 'images'], function () {
  gulp.watch(paths.styles.src + '**/*.scss', ['compress-css']);
  gulp.watch(paths.scripts.src + '**/*.js', ['scripts']);
  gulp.watch(paths.images.src + '**/*', ['images']);
});

// BROWSER SYNC TASK
gulp.task('sync', ['compress-css', 'scripts', 'images', 'browser-sync'], function () {
  gulp.watch(paths.styles.src + '**/*.scss', ['compress-css']);
  gulp.watch(paths.scripts.src + '**/*.js', ['scripts']);
  gulp.watch(paths.images.src + '**/*', ['images']);
});

// INSTALL BOWER DEPENDENCIES
gulp.task('bower-install', function () {
  return bower();
});

// MOVE BOWER MAIN FILES
var filterByExtension = function (extension) {
  return filter(function (file) {
    return file.path.match(new RegExp('.' + extension + '$'));
  }, {
    restore: true
  });
};
gulp.task('bower-single-files', ['bower-install'], function () {
  var mainFiles = mainBowerFiles();
  if (!mainFiles.length) {
    return;
  }
  var jsFilter = filterByExtension('js');
  return gulp.src(mainFiles)
    .pipe(jsFilter)
    .pipe(gulp.dest(paths.scripts.src + 'vendor/'))
    .pipe(jsFilter.restore)
    .pipe(filterByExtension('css'))
    .pipe(gulp.dest(paths.styles.src + 'vendor/'))
    .pipe(jsFilter.restore)
    .pipe(filterByExtension('css'))
    .pipe(gulp.dest(paths.styles.src + 'vendor/'));
});

// REMOVE BOWER COMPONENTS FOLDER
gulp.task('clean-bower', ['bower-single-files'], function () {
  del('bower_components/');
});

gulp.task('bower', ['clean-bower']);