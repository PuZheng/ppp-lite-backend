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
        table.string('value').unique();
    }).createTable('TB_PROJECT_TAG', function (table) {
        table.integer('project_id').references('TB_PROJECT.id'),
        table.integer('tag_id').references('TB_TAG.id');
    }).createTable('TB_USER', function (table) {
        table.increments();
        table.string('email');
        table.string('password');
        table.integer('role_id').references('TB_ROLE.id');
        table.timestamps();
    }).createTable('TB_ROLE', function (table) {
        table.increments();
        table.string('name').unique();
    }).createTable('TB_DEPARTMENT', function (table) {
        table.increments();
        table.string('name').unique();
    }).createTable('TB_USER_DEPARTMENT', function (table) {
        table.integer('user_id').references('TB_USER.id'),
        table.integer('department_id').references('TB_DEPARTMENT.id');
    });
};

module.exports = initDB;

if (require.main === module) {
    var knex = require('../setup-knex.js');
    initDB(knex).then(function () {
        knex.destroy();
    });
}
