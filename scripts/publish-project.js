#! /usr/bin/env node

var knex = require('../setup-knex.js');
var _ = require('lodash');
var supertest = require('co-supertest');
var co = require('co');
var argv = require('yargs').argv;
var logger = require('../setup-logger.js');
var getProject = require('../project.js').getProject;

var publishProject = function *(project) {
    'use strict';

    var app = (yield require('../index.js').setupPromise).callback();
    var token = 'Bearer ' + (yield require('./make-login-request.js')(app, project.owner.email, project.owner.email.split('@')[0])).token;

    var workflow = (yield supertest(app).post('/workflow/main-project-workflow').set('Authorization', token).send({
        project: project,
        comment: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    }).end()).body;
    var rsp = yield supertest(app).put('/project/project-object/' + project.id).set('Authorization', token).send({
        workflowId: workflow.id,
    }).end();
    if (rsp.error) {
        throw rsp.error;
    }
    return (yield getProject(project.id));
};

module.exports = publishProject;

if (require.main === module) {

    if (!argv.id) {
        console.log('Usage: publish-project.js --id <projectId>');
        process.exit(1);
    }
    co(function *() {
        yield *publishProject(yield getProject(argv.id));
    }).then(function () {
        knex.destroy();
        process.exit(0);
    });
}
