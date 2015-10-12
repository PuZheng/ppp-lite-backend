var koa = require('koa');
var cors = require('kcors');
var knex = require('./setup-knex.js');
var mount = require('koa-mount');
var slow = require('koa-slow');
var fs = require('fs');
var config = require('./config.js');
var jwt = require('koa-jwt');
var logger = require('./setup-logger.js');

var app = koa();

var koaLogger = require('koa-bunyan');


fs.readFile(config.get('publicKey'), function (err, data) {
    if (err) {
        throw err;
    }

    app.use(jwt({
        secret: data,
        algorithm: 'RS256',
    }).unless(function () {
        return this.method === 'OPTIONS' || 
            this.url.match(/^\/auth/) ||
            (this.url.match(/^\/assets/) && this.method === 'GET');
    }))
    .use(cors())
    .use(koaLogger(logger, {
        // which level you want to use for logging?
        // default is info
        level: 'info',
        // this is optional. Here you can provide request time in ms,
        // and all requests longer than specified time will have level 'warn'
        timeLimit: 100
    }))
    .use(mount('/project', require('./project.js')))
    .use(mount('/tag', require('./tag.js')))
    .use(mount('/auth', require('./auth.js')))
    .use(mount('/workflow', require('./workflow.js')))
    .use(mount('/assets', require('./assets.js')))
    .use(mount('/todo', require('./todo.js')))
    .use(mount('/user', require('./user.js')));
    var config = require('./config.js');
    //config.get('env') === 'development' && app.use(slow({
        //delay: config.get('fake_delay'),
    //}));

    app.listen(config.get('port'));
});
