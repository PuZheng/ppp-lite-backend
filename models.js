var knex = require('./setup-knex.js');
var bookshelf = require('bookshelf')(knex);
var casing = require('casing');
var bcrypt = require('bcrypt');

var Project = bookshelf.Model.extend({
    tableName: 'TB_PROJECT',
    projectType: function () {
        return this.belongsTo(ProjectType, 'project_type_id');
    },
    serialize: function () {
        return casing.camelize(bookshelf.Model.prototype.serialize.apply(this));
    },
    tags: function () {
        return this.belongsToMany(Tag, 'TB_PROJECT_TAG', 'project_id', 'tag_id');
    }
});

var Tag = bookshelf.Model.extend({
    tableName: 'TB_TAG',
    serialize: function () {
        return {
            id: this.get('id'),
            value: this.get('value')
        };
    }
});

var ProjectType = bookshelf.Model.extend({
    tableName: 'TB_PROJECT_TYPE',
    serialize: function () {
        return casing.camelize(bookshelf.Model.prototype.serialize.apply(this));
    }
});

var User = bookshelf.Model.extend({
    tableName: 'TB_USER',
}, {
    login: function (email, password) {
        if (!email || !password) {
            var err = new Error('请输入用户邮箱或者密码');
            err.code = 'MISS_FIELDS';
            throw err;
        }
        return new this({email: email.toLowerCase().trim()}).fetch({require: true}).tap(function(user) {
            return new Promise(function (resolve, reject) {
                return bcrypt.compare(password, user.get('password'), function (error, same) {
                    if (!same) {
                        reject(new Error('incorrect email or password'));
                    } else {
                        resolve(user);
                    }
                });
            });
        });
    }
});

module.exports = {
    Project: Project,
    ProjectType: ProjectType,
    Tag: Tag,
    User: User,
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

