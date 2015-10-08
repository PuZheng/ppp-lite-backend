#! /usr/bin/env node
var __doc__ = `

setup the minimum data

`;

var knex = require('../setup-knex.js');
var initDB = require('./init-db.js');
var co = require('co');
var path = require('path');
var shell = require('shelljs');

function *setUpData() {
    yield initDB(knex);
    try {
        shell.mkdir('-p', path.join('assets/uploads'));
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
}

if (require.main === module) {
    co(function *() {
        yield setUpData();
    }).then(function () {
        knex.destroy();
        console.log('set up data done');
    }, function (err) {
        knex.destroy();
        console.error(err);
    });
}

module.exports = setUpData;

