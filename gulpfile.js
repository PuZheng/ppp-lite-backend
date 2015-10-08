var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var shelljs = require('shelljs');
var config = require('./config.js');

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

gulp.task('clean', function () {
    shelljs.exec('./scripts/clear-db.js && rm -f assets/uploads/*');
});

gulp.task('make-test-data', ['clean'], function () {
   shelljs.exec('./scripts/make-test-data.js');
});

gulp.task('generate-keys', function () {
    shelljs.exec('openssl genrsa -out ' + config.get('privateKey') + ' 1024');
    shelljs.exec('openssl rsa -in ' + config.get('privateKey') + ' -pubout -out ' + config.get('publicKey'));
});

gulp.task('default', ['serve-dev']);
