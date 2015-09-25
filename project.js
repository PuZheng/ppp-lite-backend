var koa = require('koa');
var router = require('koa-router')();
var knex = require('./setup-knex.js');
var models = require('./models.js');
var koaBody = require('koa-body')();
var json = require('koa-json');
var Bookshelf = require('bookshelf')(knex);
var casing = require('casing');
var _ = require('lodash');

var app = koa();

router.get('/project-list.json', function *(next) {
    var model = models.Project;
    var totalCount = yield model.count();
    
    if (this.query.page && this.query.per_page) {
        var page = parseInt(this.query.page);
        var perPage = parseInt(this.query.per_page);
        model = model.query(function (q) {
            q.offset((page - 1) * perPage).limit(perPage).orderBy('created_at', 'desc');
        });
    }

    this.body = {
        data: (yield model.fetchAll({ withRelated: ['projectType', 'tags'] })).toJSON({
            omitPivot: true
        }),
        totalCount: totalCount,
    };
    yield next;	
}).post('/project-object', koaBody, function *(next) {
    var data = casing.snakeize(this.request.body);
    tags = data.tags;
    data = _.omit(data, 'tags');
    
    data.created_at = new Date();
    var model = yield models.Project.forge(data).save();
    yield model.tags().attach(tags);
    this.body = (yield model.load('projectType')).toJSON();
    yield next;	
}).get('/project-type-list.json', function *(next) {
    var model = models.ProjectType;
    var totalCount = yield model.count();

    this.body = {
        data: (yield model.fetchAll()).toJSON(),
        totalCount: totalCount,
    };
    yield next;
}).get('/project-object/:id', function *(next) {
    try {
        this.body = (yield models.Project.where('id', this.params.id).fetch(
            { withRelated: ['projectType', 'tags'], require: true })).toJSON({ omitPivot: true });
    } catch (err) {
        if (err.message === 'EmptyResponse') {
            this.response.status = 404;
        } else {
            throw err;
        }
    }
    yield next;
}).put('/project-object/:id', koaBody, function *(next) {
    var model = models.Project.forge({'id': this.params.id});
    var request = this.request.body;
    yield Bookshelf.transaction(function (t) {
        for (var k in request) {
            switch (k) {
                case 'tags': {
                    for (var i = 0; i < request[k].length; ++i) {
                        var arg = request[k][i];
                        if (arg.op === 'delete') {
                            model.tags().detach(arg.id, { transacting: t }).then(t.commit);
                        } else if (arg.op === 'add') {
                            model.tags().attach(arg.id, { transacting: t }).then(t.commit);
                        }
                    }
                    break;
                }
                default: {
                    model.save(casing.snakeize(_.object([[k, request[k]]])), { patch: true, transacting: t}).then(t.commit);
                    break;
                }
            }
        }
    });
    this.body = {};
    yield next;	
}).delete('/project-object/:id', function *(next) {
    try {
        var model = yield models.Project.where('id', this.params.id).fetch({
            require: true
        });
        yield model.destroy();
    } catch (err) {
        if (err.message === 'EmptyResponse') {
            this.response.status = 404;
        } else {
            throw err;
        }
    }
    this.body = {};
    yield next;
});

app.use(json())
.use(router.routes())
.use(router.allowedMethods());
module.exports = app;
