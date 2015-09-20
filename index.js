var koa = require('koa');
var json = require('koa-json');
var cors = require('kcors');
var knex = require('./setup-knex.js');
var bunyan = require('bunyan');
var koaBody = require('koa-body')();

var app = koa();
var router = require('koa-router')();

var logger = bunyan.createLogger({name: "ppp-lite"});
var koaLogger = require('koa-bunyan');
var models = require('./models.js');
var casing = require('casing');

router.get('/project/project-list.json', function *(next) {
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
}).post('/project/project-object', koaBody, function *(next) {
    var data = casing.snakeize(this.request.body);
    data.created_at = new Date();
    var model = yield models.Project.forge(data).save();
    this.body = (yield model.load('projectType')).toJSON();
    yield next;	
}).get('/project/project-type-list.json', function *(next) {
    var model = models.ProjectType;
    var totalCount = yield model.count();

    this.body = {
        data: (yield model.fetchAll()).toJSON(),
        totalCount: totalCount,
    };
    yield next;
}).get('/project/project-object/:id', function *(next) {
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
}).put('/project/project-object/:id', koaBody, function *(next) {
    this.body = yield models.Project.forge({'id': this.params.id}).save(casing.snakeize(this.request.body), { patch: true });
    yield next;	
}).delete('/project/project-object/:id', function *(next) {
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
