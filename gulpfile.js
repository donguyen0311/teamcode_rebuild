var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var browserify = require('browserify');
var gutil = require('gulp-util');
var babel = require('gulp-babel');


gulp.task('angular', () => {
    return gulp.src(['client/app/**/app.js', 'client/app/**/*.js'])
        .pipe(concat('bundles.js'))
        .pipe(ngAnnotate({
            add: true
        }))
        .pipe(babel({
			presets: ['es2015']
		}))
        .pipe(uglify())
        .on('error', function (err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
            this.emit('end');
        })
        .pipe(gulp.dest('client/bundles'))
})

gulp.task('watch', () => {
    return gulp.watch(['client/app/**/app.js', 'client/app/**/*.js'], ['angular']);
});

gulp.task('default', ['angular', 'watch']);