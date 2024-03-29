var koa = require('koa');
var router = require('koa-router')();
var koaBody = require('koa-body')();
var models = require('./models.js');
var json = require('koa-json');
var casing = require('casing');
var defs = require('./defs.js');

router.get('/list.json', function *(next) {
    'use strict';
    // why so verbose? https://github.com/tgriesser/bookshelf/issues/941
    var model = models.Todo.where('completed', null).where('target', 'in', ['role.' + this.state.user.role.name, 'user.' + this.state.user.id]);
    if (this.query.page && this.query.per_page) {
        var page = parseInt(this.query.page);
        var perPage = parseInt(this.query.per_page);
        model = model.query(function (q) {
            q.offset((page - 1) * perPage).limit(perPage);
        });
    }
    model = model.query(function (q) {
        q.orderBy('created_at', 'desc');
    });
    this.body = {
        data: (yield model.fetchAll()).toJSON(),
    };
    yield next; 
}).put('/object/:id', koaBody, function *(next) {
    'use strict';

    // TODO should check permission
    this.body = yield models.Todo.forge({'id': this.params.id}).save(casing.snakeize(this.request.body), {
        patch: true
    });
});

module.exports = koa().use(json()).use(router.routes()).use(router.allowedMethods());

