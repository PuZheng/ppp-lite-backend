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
    },

    assets: function () {
        return this.belongsToMany(Asset, 'TB_PROJECT_ASSET', 'project_id', 'asset_id');
    },

    workflow: function () {
        return this.belongsTo(Workflow, 'workflow_id');
    },

    owner: function () {
        return this.belongsTo(User, 'owner_id');
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

var Department = bookshelf.Model.extend({
    tableName: 'TB_DEPARTMENT'
});

var User = bookshelf.Model.extend({
    tableName: 'TB_USER',
    role: function () {
        return this.belongsTo(Role, 'role_id');
    },
    serialize: function () {
        var ret = casing.camelize(bookshelf.Model.prototype.serialize.apply(this));
        delete ret.password;
        return ret;
    }
}, {
    login: function (email, password) {
        if (!email || !password) {
            var err = new Error('请输入用户邮箱或者密码');
            err.code = 'MISS_FIELDS';
            throw err;
        }

        return new this({email: email.toLowerCase().trim()}).fetch({ withRelated: ['role'], require: true}).tap(function(user) {
            return new Promise(function (resolve, reject) {
                return bcrypt.compare(password, user.get('password'), function (error, same) {
                    if (!same) {
                        reject(new Error('incorrect email or password'));
                    } else {
                        resolve(user);
                    }
                });
            });
        }).catch(function (err) {
            throw new Error('incorrect email or password');
        });
    }
});

var Role = bookshelf.Model.extend({
    tableName: 'TB_ROLE',
});

var Asset = bookshelf.Model.extend({
    tableName: 'TB_ASSET',
    serialize: function () {
        return casing.camelize(bookshelf.Model.prototype.serialize.apply(this));
    }
});

var Workflow = bookshelf.Model.extend({
    tableName: 'TB_WORKFLOW',
    actions: function () {
        return this.hasMany(Action, 'workflow_id');
    }
});

var Action = bookshelf.Model.extend({
    tableName: 'TB_ACTION',
    workflow: function () {
        return this.belongsTo(Workflow, 'workflow_id');
    },
    serialize: function () {
        return casing.camelize(bookshelf.Model.prototype.serialize.apply(this));
    }
});

var Todo = bookshelf.Model.extend({
    tableName: 'TB_TODO',
    project: function () {
        return this.belongsTo(Project, 'project_id');
    },
    serialize: function () {
        var ret = casing.camelize(bookshelf.Model.prototype.serialize.apply(this));
        ret.bundle = ret.bundle && JSON.parse(ret.bundle);
        return ret;
    }
});

module.exports = {
    Project: Project,
    ProjectType: ProjectType,
    Tag: Tag,
    User: User,
    Department: Department,
    Asset: Asset,
    Role: Role,
    Workflow: Workflow,
    Action: Action,
    Todo: Todo
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

