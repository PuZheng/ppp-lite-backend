var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var shelljs = require('shelljs');

gulp.task('serve-dev', function() {
    var options = {
        script: './index.js',
        execMap: {
            "js": "node"
        },
        delayTime: 1,
        watch: ['./']
    };

    return nodemon(options);
});

gulp.task('make-test-data', function () {
   shelljs.exec('./scripts/clear-db.js && ./scripts/make-test-data.js');
});

gulp.task('default', ['serve-dev']);
