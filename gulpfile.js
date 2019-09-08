const gulp = require('gulp');
const concat = require('gulp-concat');
const inject = require('gulp-inject');

gulp.task('default', done => {
  const indexFile = gulp.src('./shared/index.html');
  const mainAppFiles = gulp.src(['./shared/app/*.js', './shared/app/**/*.js'],
    { read: false });

  indexFile
  .pipe(inject(mainAppFiles, { ignorePath: 'shared', addRootSlash: false }))
  .pipe(gulp.dest('shared/'));

  done();
});

gulp.task('compress', done => {
  gulp.src(['./shared/app/*.js'])
    .pipe(concat('./shared/all-app.js'))
    .pipe(gulp.dest('./'));
  done();
});
