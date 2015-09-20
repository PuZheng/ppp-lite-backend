#! /usr/bin/env node

var knex = require('../setup-knex.js');
var co = require('co');
var fs = require('fs');

var initDB = require('./init-db.js');
var _ = require('lodash');
var chance = require('chance')();

co(function *() {
    yield initDB(knex);
    console.log('creating project types...');
    yield knex.insert([
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

    console.log('creating projects...');
    var projectTypes = yield knex('TB_PROJECT_TYPE').select('*');
    yield knex.insert(_(64).times(function () {
        return {
            name: chance.word(),
            budget: chance.natural({
                min: 10000, 
                max: 3000 * 10000
            }),
            description: chance.sentence(),
            created_at: new Date(),
            project_type_id: _.sample(projectTypes).id,
        };
    }).value()).into('TB_PROJECT');

    console.log('creating tags...');
    yield knex.insert([
        '建设',
        '水利',
        '教育',
        '卫生',
        'BT',
        'BOT',
        'BOOT',
        'TOT',
        '道路',
        '固废垃圾'
    ].map(function (tag) {
        return { value: tag };
    })).into('TB_TAG');

    var projects = yield knex('TB_PROJECT').select('*');
    var tags = yield knex('TB_TAG').select('*');
    
    var data = _.flatten(projects.map(function (project) {
        return  _(_.random(1, 5)).times(
            function () {
                return {
                    project_id: project.id,
                    tag_id: _.sample(tags).id,
                };
            }
        ).value();
    }));
    yield knex.insert(data).into('TB_PROJECT_TAG');
}).then(function () {
    knex.destroy();
    console.log('make test data done!');
}, function (err) {
    knex.destroy();
    console.log(err);
});
