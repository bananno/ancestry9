const gulp = require('gulp');
const concat = require('gulp-concat');

// gulp.task('default', done => {
//   done();
// });

gulp.task('compress', done => {
  gulp.src(['./shared/app/*.js'])
    .pipe(concat('./shared/all-app.js'))
    .pipe(gulp.dest('./'));
  done();
});
