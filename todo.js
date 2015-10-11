var koa = require('koa');
var router = require('koa-router')();
var koaBody = require('koa-body')();
var models = require('./models.js');
var json = require('koa-json');
var casing = require('casing');
var defs = require('./defs.js');

router.get('/list.json', function *(next) {
    'use strict';
    var model = models.Todo.query(function (q) {
        q.where('completed', null);
    });
    var totalCount = yield model.count();
    if (this.query.page && this.query.per_page) {
        var page = parseInt(this.query.page);
        var perPage = parseInt(this.query.per_page);
        model = model.query(function (q) {
            q.offset((page - 1) * perPage).limit(perPage);
        });
    }
    if (this.state.user.role.name === defs.ROLE.PPP_CENTER) {
        model = model.query(function (q) {
            q.where('target', 'role.' + defs.ROLE.PPP_CENTER);
        });
    }
    model = model.query(function (q) {
        q.orderBy('created_at', 'desc');
    });
    this.body = {
        data: (yield model.fetchAll()).toJSON(),
        totalCount: totalCount,
    };
    yield next; 
});

module.exports = koa().use(json()).use(router.routes()).use(router.allowedMethods());

