var koa = require('koa');
var json = require('koa-json');
var cors = require('kcors');
var knex = require('./setup-knex.js');
var bunyan = require('bunyan');

var app = koa();
var router = require('koa-router')();

var logger = bunyan.createLogger({name: "ppp-lite"});
var koaLogger = require('koa-bunyan');

router.get('/project/list.json', function *(next) {
    var q = knex('TB_PROJECT').count('* as count');
    var totalCount = (yield q)[0].count;
    
    q = knex('TB_PROJECT').select('*');

    if (this.query.page && this.query.per_page) {
        var page = parseInt(this.query.page);
        var perPage = parseInt(this.query.per_page);
        q = q.offset((page - 1) * perPage).limit(perPage);
    }

    this.body = {
        data: yield q,
        totalCount: totalCount,
    };
    yield next;	
});


app.use(json())
.use(router.routes())
.use(router.allowedMethods())
.use(cors())
.use(koaLogger(logger, {
    // which level you want to use for logging?
    // default is info
    level: 'info',
    // this is optional. Here you can provide request time in ms,
    // and all requests longer than specified time will have level 'warn'
    timeLimit: 100
}));


var config = require('./config.js');
app.listen(config.get('port'));
