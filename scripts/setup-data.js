#! /usr/bin/env node

var knex = require('../setup-knex.js');
var initDB = require('./init-db.js');
var co = require('co');
var path = require('path');
var fs = require('mz/fs');

function *setUpData() {
    yield initDB(knex);
    try {
        yield fs.mkdir(path.join('assets/uploads'));
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

