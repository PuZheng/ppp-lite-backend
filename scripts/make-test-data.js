#! /usr/bin/env node

var knex = require('../setup-knex.js');
var q = require('q');
var fs = require('fs');

var initDB = require('./init-db.js');
var _ = require('underscore');
var chance = require('chance')();

initDB(knex).then(function () {
    return knex.insert([
        '市政基础设施建设',
        '文教卫',
        '政法',
        '水利',
        '交通'
    ].map(function (name) {
        return {
            name: name,
            description: chance.sentence(),
            created_at: new Date(),
        };
    })).into('TB_PROJECT_TYPE');
}).then(function () {
    return knex('TB_PROJECT_TYPE').select('*');
}).then(function (types) {
    return knex.insert(_(64).times(function () {
        return {
            name: chance.word(),
            budget: chance.natural(),
            description: chance.sentence(),
            created_at: new Date(),
            project_type_id: _.sample(types).id,
        };
    })).into('TB_PROJECT');
}).done(function () {
    knex.destroy();
});
