var koa = require('koa');
var router = require('koa-router')();
var knex = require('./setup-knex.js');
var models = require('./models.js');
var json = require('koa-json');
var koaBody = require('koa-body')();

var app = koa();

router.get('/tag-list.json', function *(next) {
    yield next;
    this.body = (yield models.Tag.fetchAll()).toJSON();
}).post('/tag-object', koaBody, function *(next) {
    yield next;
    try {
        this.body = (yield models.Tag.forge(this.request.body).save()).toJSON();
    } catch (err) {
        if (err && err.code === 'SQLITE_CONSTRAINT') {
            this.body = {
                reason: 'tag already exists'
            };
            this.response.status = 404;
            return;
        } 
        throw err;
    }
});

app.use(json())
.use(router.routes())
.use(router.allowedMethods());


module.exports = app;
