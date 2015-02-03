var gulp = require('gulp');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var browserify = require('gulp-browserify');

var dist = 'dist';

function swallowError(error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('browserify', function () {
    gulp.src('app.js')
        .pipe(browserify())
        .on('error', swallowError)
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest(dist + '/'));
});

gulp.task('bootstrap-fonts', function () {
    gulp.src('node_modules/bootstrap/dist/fonts/*')
        .pipe(gulp.dest(dist + '/fonts/'));
});

gulp.task('bootstrap-css', function () {
    gulp.src([
            'node_modules/bootstrap/dist/css/bootstrap.min.css'
            //'node_modules/bootstrap/dist/css/bootstrap-theme.min.css'
        ])
        .pipe(concat('styles.css'))
        .pipe(gulp.dest(dist + '/'));
});

gulp.task('bootstrap', ['bootstrap-fonts', 'bootstrap-css']);

gulp.task('html', function () {
    gulp.src('index.html')
        .pipe(gulp.dest(dist + '/'));
});

gulp.task('watch', function () {
    return gulp.watch(
        ['*.js', 'index.html'],
        ['browserify', 'html']
    );
});

gulp.task('dist', ['bootstrap', 'browserify', 'html']);




