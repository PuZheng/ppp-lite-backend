var koa = require('koa');
var router = require('koa-router')();
var koaBody = require('koa-body')();
var models = require('./models.js');
var json = require('koa-json');
var casing = require('casing');

router.put('/user-object/:id', koaBody, function *(next) {
    'use strict';
    if (this.state.user.id != this.params.id) {
        this.status = 401;
        this.body = {
            reason: '您没有权限修改他人信息',
        };
        return;
    }
    var model = models.User.forge({'id': this.params.id});
    var patch = casing.snakeize(this.request.body);
    yield model.save(patch, { 
        patch: true, 
    });
    this.body = patch;
    yield next; 
});

module.exports = koa().use(json()).use(router.routes()).use(router.allowedMethods());

