var koa = require('koa');
var cors = require('kcors');
var knex = require('./setup-knex.js');
var bunyan = require('bunyan');
var mount = require('koa-mount');

var app = koa();
var router = require('koa-router')();

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
.use(mount('/tag', require('./tag.js')));


var config = require('./config.js');
app.listen(config.get('port'));
