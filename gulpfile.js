const gulp = require('gulp');
const concat = require('gulp-concat');
const inject = require('gulp-inject');

const paths = {
  mainApp: ['./shared/app/*.js', './shared/app/**/*.js'],
  tests: ['./shared/tests/*.js'],
  style: ['./shared/stylesheets/*.css', './shared/stylesheets/**/*.css'],
  compressApp: './shared/all-app.js',
  compressStyle: './shared/all-style.css',
};

gulp.task('inject-all-shared-app-files', () => {
  const indexFile = gulp.src('./shared/index.html');
  const jsFiles = gulp.src([...paths.mainApp, ...paths.tests], { read: false });

  return indexFile
  .pipe(inject(jsFiles, { ignorePath: 'shared', addRootSlash: true }))
  .pipe(gulp.dest('shared/'));
});

gulp.task('inject-all-shared-style-files', () => {
  const indexFile = gulp.src('./shared/index.html');
  const cssFiles = gulp.src(paths.style, { read: false });

  return indexFile
  .pipe(inject(cssFiles, { ignorePath: 'shared', addRootSlash: true }))
  .pipe(gulp.dest('shared/'));
});

gulp.task('compress-shared-app-files', () => {
  return gulp.src(paths.mainApp)
  .pipe(concat(paths.compressApp))
  .pipe(gulp.dest('./'));
});

gulp.task('compress-shared-style-files', () => {
  return gulp.src(paths.style)
  .pipe(concat(paths.compressStyle))
  .pipe(gulp.dest('./'));
});

gulp.task('inject-compressed-shared-app', () => {
  const indexFile = gulp.src('./shared/index.html');
  const jsFiles = gulp.src(paths.compressApp, { read: false });

  return indexFile
  .pipe(inject(jsFiles, { ignorePath: 'shared', addRootSlash: true }))
  .pipe(gulp.dest('shared/'));
});

gulp.task('inject-compressed-shared-style', () => {
  const indexFile = gulp.src('./shared/index.html');
  const cssFiles = gulp.src(paths.compressStyle, { read: false });

  return indexFile
  .pipe(inject(cssFiles, { ignorePath: 'shared', addRootSlash: true }))
  .pipe(gulp.dest('shared/'));
});

gulp.task('dev', gulp.series(
  'inject-all-shared-app-files',
  'inject-all-shared-style-files'
));

gulp.task('prod', gulp.series(
  'compress-shared-app-files',
  'compress-shared-style-files',
  'inject-compressed-shared-app',
  'inject-compressed-shared-style'
));
