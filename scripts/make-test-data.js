#! /usr/bin/env node

var knex = require('../setup-knex.js');
var q = require('q');
var fs = require('fs');

var initDB = require('./init-db.js');
var _ = require('underscore');
var chance = require('chance')();

initDB(knex).then(function () {
    return knex.insert(_(32).times(function () {
        return {
            name: chance.word(),
            budget: chance.natural(),
            created_at: new Date(),
        };
    })).into('TB_PROJECT');
}).done(function () {
    knex.destroy();
});
