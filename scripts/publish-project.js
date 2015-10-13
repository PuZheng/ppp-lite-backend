#! /usr/bin/env node

var knex = require('../setup-knex.js');
var _ = require('lodash');
var supertest = require('co-supertest');
var co = require('co');
var argv = require('yargs').argv;
var logger = require('../setup-logger.js');

var publishProject = function *(id) {
    'use strict';

    var project = (yield knex('TB_PROJECT').where('id', id).select('*'))[0];
    var owner = (yield knex('TB_USER').where('id', project.owner_id).select('*'))[0];
    var app = yield new Promise(function (resolve, reject) {
        require('../index.js').setup(function (app) {
            resolve(app.callback());
        });
    });
    var rsp = yield supertest(app).post('/auth/login').send({
        email: owner.email,
        password: owner.email.split('@')[0],
    }).end();
    if (rsp.error) {
        throw rsp.error;
    }
    var token = 'Bearer ' + rsp.body.token;
    var workflow = (yield supertest(app).post('/workflow/main-project-workflow').set('Authorization', token).send({
        project: project,
        comment: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    }).end()).body;
    if (rsp.error) {
        throw rsp.error;
    }
    rsp = yield supertest(app).put('/project/project-object/' + project.id).set('Authorization', token).send({
        workflowId: workflow.id,
    }).end();
    if (rsp.error) {
        throw rsp.error;
    }
};

module.exports = publishProject;

if (require.main === module) {

    if (!argv.id) {
        console.log('Usage: publish-project.js --id <projectId>');
        process.exit(1);
    }
    co(function *() {
        yield *publishProject(argv.id);
    }).then(function () {
        console.log('ok');
        knex.destroy();
        process.exit(1);
    });
}
