const gulp = require('gulp');
const concat = require('gulp-concat');
const inject = require('gulp-inject');

const paths = {
  mainApp: ['./shared/app/*.js', './shared/app/**/*.js'],
  compressApp: './shared/all-app.js',
};

gulp.task('inject-all-shared-app-files', () => {
  const indexFile = gulp.src('./shared/index.html');
  const jsFiles = gulp.src(paths.mainApp, { read: false });

  return indexFile
  .pipe(inject(jsFiles, { ignorePath: 'shared', addRootSlash: false }))
  .pipe(gulp.dest('shared/'));
});

gulp.task('compress-shared-app-files', () => {
  return gulp.src(paths.mainApp)
  .pipe(concat(paths.compressApp))
  .pipe(gulp.dest('./'));
});

gulp.task('inject-compressed-shared-app', () => {
  const indexFile = gulp.src('./shared/index.html');
  const jsFiles = gulp.src(paths.compressApp, { read: false });

  return indexFile
  .pipe(inject(jsFiles, { ignorePath: 'shared', addRootSlash: false }))
  .pipe(gulp.dest('shared/'));
});

gulp.task('dev', gulp.series(
  'inject-all-shared-app-files'
));

gulp.task('prod', gulp.series(
  'compress-shared-app-files',
  'inject-compressed-shared-app'
));
