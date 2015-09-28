#! /usr/bin/env node

var knex = require('../setup-knex.js');
var co = require('co');
var fs = require('fs');

var initDB = require('./init-db.js');
var setupData = require('./setup-data.js');
var _ = require('lodash');
var chance = require('chance')();
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'make test data'});
var bcrypt = require('bcrypt');

co(function *() {
    yield setupData();
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

    console.log('creating roles...');
    yield knex('TB_ROLE').insert([
       '业主',
       'PPP中心',
       '咨询顾问',
       '投资人',
       '政府代表',
    ].map(function (role) {
        return {
            name: role 
        };
    }));

    var roles = {}; 
    for (var role of (yield knex('TB_ROLE').select('*'))) {
        roles[role.name] = role;
    }

    console.log('creating users...');

    var genHash = function (user) {
        return new Promise(function (resolve, reject) {
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(user, salt, function(err, hash) {
                    resolve(hash);
                });
            });
        });
    };
    for (var users of [
        {
            users: _.times(3, function (n) {
                return 'mzj' + n;
            }),
            department: '民政局'
        },
        {
            users: _.times(3, function (n) {
                return 'gaj' + n;
            }),
            department: '公安局',
        },
        {
            users: _.times(3, function (n) {
                return 'jyj' + n;
            }),
            department: '教育局'
        },
        {
            users: _.times(3, function (n) {
                return 'wsj' + n;
            }),
            department: '卫生局'
        }
    ]) {
        var departmentId = (yield knex('TB_DEPARTMENT').insert({
            name: users.department
        }))[0];
        for (var user of users.users) {
            var hash = yield genHash(user);
            var userId = (yield knex.insert({
                email: user + '@gmail.com',
                password: hash,
                role_id: roles['业主'].id,
                created_at: new Date(),
            }).into('TB_USER'))[0];
            yield knex('TB_USER_DEPARTMENT').insert({
                department_id: departmentId,
                user_id: userId,
            });
        }
    }
}).then(function () {
    knex.destroy();
    console.log('make test data done!');
}, function (err) {
    knex.destroy();
    console.log(err);
});
