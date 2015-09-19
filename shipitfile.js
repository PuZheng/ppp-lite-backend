module.exports = function (shipit) {
    var targetPath = '/home/xiechao/work/ppp-lite-backend';
    shipit.initConfig({
        staging: {
            servers: {
                host: '115.29.232.202',
                user: 'xiechao'
            }
        }
    });

    shipit.task('make-test-data', function () {
        shipit.remote([
            'cd ' + targetPath,
            'gulp make-test-data',
        ].join(' && '));
    });

    shipit.task('quick-ship', function () {
        shipit.remote([
            'cd ' + targetPath,
            'git pull origin master',
            'cnpm install --cache',
        ].join(' && '));
    });
};
