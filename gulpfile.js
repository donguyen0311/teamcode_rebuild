var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var browserify = require('browserify');

gulp.task('angular', () => {
    return gulp.src(['client/app/**/app.js', 'client/app/**/*.js'])
        .pipe(concat('bundles.js'))
        .pipe(ngAnnotate({add: true}))
        // .pipe(uglify())
        .pipe(gulp.dest('client/bundles'))
})

gulp.task('watch', () => {
    return gulp.watch(['client/app/**/app.js', 'client/app/**/*.js'], ['angular']);
});

gulp.task('default', ['angular', 'watch']);

