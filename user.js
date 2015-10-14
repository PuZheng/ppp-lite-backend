var koa = require('koa');
var router = require('koa-router')();
var koaBody = require('koa-body')();
var models = require('./models.js');
var json = require('koa-json');
var casing = require('casing');
var defs = require('./defs');
var logger = require('./setup-logger.js');

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
}).get('/list.json', function *(next) {
    'use strict';
    var self = this;
    var model = models.User;
    if (this.query.role) {
        model = model.query(function (q) {
            q.join('TB_ROLE', 'role_id', 'TB_ROLE.id').where('TB_ROLE.name', self.query.role);
        });
    }
    var data = (yield model.fetchAll({ withRelated: ['role'] })).toJSON(); 
    var getFirm = function *(userId) {
        return (yield models.Firm.query(function (q) {
                q.where({'TB_USER_FIRM.user_id': userId}).join('TB_USER_FIRM', 'TB_FIRM.id', 'TB_USER_FIRM.firm_id');
        }).fetch()).toJSON();
    };
    for (var user of data) {
        if (user.role.name === defs.ROLE.CONSULTANT) {
            user.firm = yield *getFirm(user.id);
        }
    }
    this.body = {
        data: data,
    };
    yield next;
});

module.exports = koa().use(json()).use(router.routes()).use(router.allowedMethods());

