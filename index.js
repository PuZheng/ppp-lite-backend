var koa = require('koa');
var cors = require('kcors');
var knex = require('./setup-knex.js');
var bunyan = require('bunyan');
var mount = require('koa-mount');
var slow = require('koa-slow');

var app = koa();

var logger = bunyan.createLogger({name: "ppp-lite"});
var koaLogger = require('koa-bunyan');


app.use(cors())
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
.use(mount('/assets', require('./assets.js')));


var config = require('./config.js');
config.get('env') === 'development' && app.use(slow({
    delay: config.get('fake_delay'),
}));

app.listen(config.get('port'));
