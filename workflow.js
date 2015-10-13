var koa = require('koa');
var router = require('koa-router')();
var koaBody = require('koa-body')();
var json = require('koa-json');
var models = require('./models.js');
var logger = require('./setup-logger.js');

var workflowEngine = require('./setup-workflow.js');

router.post('/:type', koaBody, function *(next) {
    var type = this.params.type.toUpperCase();
    var projectWorkflow = yield workflowEngine.genWorkflow(type);
    this.body =(yield projectWorkflow.start(this.state.user, this.request.body)).toJSON();
}).get('/:id', function *(next) {
    yield next;
    try {
        this.body = (yield workflowEngine.loadWorkflow(this.params.id)).toJSON();
    } catch (e) {
        if (e.message === 'EmptyResponse') {
            this.respsonse.status = 404;
        } else {
            throw e;
        }
    }
}).put('/:id/:task', koaBody, function *(next) {
    try {
        var workflow = yield workflowEngine.loadWorkflow(this.params.id);
        var action = this.request.body.action;
        var bundle = this.request.body.bundle;
        console.log(bundle);
        yield workflow[action](this.params.task, this.state.user, bundle);
        this.body = workflow.toJSON();
    } catch (e) {
        if (e.code != 'INVALID_TASK' && e.code != 'WORKFLOW_ENDED') {
            throw e;
        }
        this.status = 403;
        this.body = {
            reason: e.message
        };
    }
}).delete('/:id', function *(next) {
    try {
        var workflow = yield workflowEngine.loadWorkflow(this.params.id);
        yield workflow.abort(getOperatorId(this), this.request.body);
        this.body = workflow.toJSON();
    } catch (e) {
        if (e.code != 'WORKFLOW_ENDED') {
            throw e;
        }
        this.status = 403;
        this.body = {
            reason: e.message
        };
    }
});


module.exports = koa().use(json())
.use(router.routes())
.use(router.allowedMethods());
