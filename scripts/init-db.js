#!/usr/bin/env node
var q = require('q');


var initDB = function (knex) {
    return q.fcall(function () {
        return knex.schema.createTable('TB_PROJECT', function (table) {
            table.increments();
            table.string('name');
            table.integer('budget');
            table.string('description', 256);
            table.timestamps();
        });
    }).then(function () {
    });
};

module.exports = initDB;

if (require.main === module) {
    var knex = require('../setup-knex.js');
    initDB(knex).done(function () {
        knex.destroy();
    });
}
