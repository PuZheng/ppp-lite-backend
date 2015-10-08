var koa = require('koa');
var router = require('koa-router')();
var knex = require('./setup-knex.js');
var models = require('./models.js');
var koaBody = require('koa-body')();
var json = require('koa-json');
var Bookshelf = require('bookshelf')(knex);
var casing = require('casing');
var _ = require('lodash');
var workflowEngine = require('./setup-workflow.js');

var app = koa();
var logger = require('./setup-logger.js');

router.get('/project-list.json', function *(next) {
    'use strict';
    var model = models.Project;
    var totalCount = yield model.count();
    
    if (this.query.page && this.query.per_page) {
        var page = parseInt(this.query.page);
        var perPage = parseInt(this.query.per_page);
        model = model.query(function (q) {
            q.offset((page - 1) * perPage).limit(perPage).orderBy('created_at', 'desc');
        });
    }

    if (this.query.published) {
        if (parseInt(this.query.published) === 0) {
            model = model.where('workflow_id', null);
        } else if (parseInt(this.query.published) == 1) {
            model = model.where('workflow_id', '<>', 'null');
        }
    }

    var data = (yield model.fetchAll({ withRelated: ['projectType', 'tags'] })).toJSON({
        omitPivot: true
    });

    for (let p of data) {
        p.workflowId && (p.workflow = (yield workflowEngine.loadWorkflow(p.workflowId)).toJSON());
    }

    this.body = {
        data: data,
        totalCount: totalCount,
    };
    yield next;	
}).post('/project-object', koaBody, function *(next) {
    var data = casing.snakeize(this.request.body);
    tags = data.tags;
    data = _.omit(data, 'tags');
    
    data.created_at = new Date();
    data.owner_id = this.state.user.id;
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
        var rsp = (yield models.Project.where('id', this.params.id).fetch(
            { 
                withRelated: ['projectType', 'tags', 'assets'], require: true 
            })).toJSON({ omitPivot: true });
        rsp.workflowId && (rsp.workflow = (yield workflowEngine.loadWorkflow(rsp.workflowId)).toJSON());
        this.body = rsp;
    } catch (err) {
        console.log('asdfalksdaflsjdlsfadlskj', err);
        if (err.message != 'EmptyResponse') {
            throw err;
        }
        this.status = 404;
    }
    yield next;
}).put('/project-object/:id', koaBody, function *(next) {
    var model = models.Project.forge({'id': this.params.id});
    var request = this.request.body;
    var handlers = {
        'tags': function (key, tags, t) {
            return tags.map(function (tag) {
                if (tag.op === 'delete') {
                    return model.tags().detach(tag.id, { transacting: t });
                } else if (tag.op === 'add') {
                    return model.tags().attach(tag.id, { transacting: t });
                }
            });
        },
        'assets': function (key, assets, t) {
            return assets.map(function (asset) {
                if (asset.op === 'delete') {
                    return model.assets().detach(asset.id, { transacting: t });
                } else if (asset.op === 'add') {
                    return model.assets().attach(asset.id, { transacting: t });
                }
            });
        },
    };
    var defaultHandler = function (key, value, t) {
        return [model.save(casing.snakeize(_.object([[key, value]])), { patch: true, transacting: t})];
    };
    yield Bookshelf.transaction(function (t) {
        return Promise.all(
            _(request).pairs().map(function (pair) {
                var key = pair[0];
                var value = pair[1];
                return (~['tags', 'assets'].indexOf(key)? handlers[key]: defaultHandler)(key, value, t);
            }).flatten().value()
        ).then(t.commit);
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
        if (err.message != 'EmptyResponse') {
            throw err;
        }
        this.status = 404;
    }
    this.body = {};
    yield next;
});

app.use(json())
.use(router.routes())
.use(router.allowedMethods());
module.exports = app;
