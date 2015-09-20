#! /usr/bin/env node

var initDB = function (knex) {
    return knex.schema.createTable('TB_PROJECT', function (table) {
        table.increments();
        table.string('name');
        table.integer('budget');
        table.string('description', 256);
        table.timestamps();
        table.integer('project_type_id').references('TB_PROJECT_TYPE.id');
    }).createTable('TB_PROJECT_TYPE', function (table) {
            table.increments();
            table.string('name');
            table.string('description', 256);
            table.timestamps();
    }).createTable('TB_TAG', function (table) {
        table.increments();
        table.string('value');
    }).createTable('TB_PROJECT_TAG', function (table) {
        table.integer('project_id').references('TB_PROJECT.id'),
        table.integer('tag_id').references('TB_TAG.id');
    });
};

module.exports = initDB;

if (require.main === module) {
    var knex = require('../setup-knex.js');
    initDB(knex).then(function () {
        knex.destroy();
    });
}
