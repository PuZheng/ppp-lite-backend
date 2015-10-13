#! /usr/bin/env node

var knex = require('../setup-knex.js');
var supertest = require('co-supertest');
var argv = require('yargs').argv;
var logger = require('../setup-logger.js');
var co = require('co');
var _ = require('lodash');
var publishProject = require('./publish-project.js');


var preAuditProject = function *(project) {

    project = yield *publishProject(project);

    var app = (yield require('../index.js').setupPromise).callback();
    var token = 'Bearer ' + (yield require('./make-login-request.js')(app, project.owner.email, project.owner.email.split('@')[0])).token;
    
    var rsp = yield supertest(app).put('/workflow/' + project.workflow.id + '/' + encodeURIComponent('预审')).set('Authorization', token).set('Content-Type', 'application/json').send({
        bundle: {
            project: project,
            comment: 'pass pre audit',
        },
        action: 'pass',
    }).end();
    if (rsp.error) {
        throw rsp.error;
    }
};

module.exports = preAuditProject;

if (require.main === module) {
    if (!argv.id) {
        console.log('Usage: pre-audit-project.js --id <projectId>');
        process.exit(1);
    }
    co(function *() {
        yield *preAuditProject(yield require('../project.js').getProject(argv.id));
    }).then(function () {
        knex.destroy();
        process.exit(0);
    });
}
