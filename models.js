var knex = require('./setup-knex.js');
var bookshelf = require('bookshelf')(knex);
var camelcaseKeys = require('camelcase-keys-recursive');

var Project = bookshelf.Model.extend({
    tableName: 'TB_PROJECT',
    projectType: function () {
        return this.belongsTo(ProjectType, 'project_type_id');
    },
    serialize: function () {
        return camelcaseKeys(bookshelf.Model.prototype.serialize.apply(this));
    }
});

var ProjectType = bookshelf.Model.extend({
    tableName: 'TB_PROJECT_TYPE',
    serialize: function () {
        return camelcaseKeys(bookshelf.Model.prototype.serialize.apply(this));
    }
});


module.exports = {
    Project: Project,
    ProjectType: ProjectType,
};

if (require.main === module) {
    Project.query(function (qb) {
        qb.limit(10).offset(10);
    }).fetchAll({ withRelated: 'projectType' }).then(function (c) {
        console.log(c.toJSON());
    }).then(function () {
        return Project.query().count(); 
    }).done(function () {
        knex.destroy();
    });
}
