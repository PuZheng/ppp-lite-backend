var _ = require('lodash');
var knex = require('./setup-knex.js');
var Bookshelf = require('bookshelf')(knex);
var models = require('./models.js');

var Workflow = function (fac) {
    this.id = null;
    this.fac = fac;
    var task = {
        name: 'START',
    };
    _.extend(task, this.fac.taskDefs.START);
    this._nextTasks = [task];
};

Workflow.prototype.start = function (operatorId, bundle) {
    return this.pass('start', operatorId, bundle);
};

Workflow.prototype.abort = function () {
    // TODO unimplemented
};

Workflow.prototype.assertTask = function (taskName) {
    taskName = taskName.toUpperCase();
    if (taskName === 'END') {
        throw {
            code: 'WORKFLOW_ENDED',
            message: 'workflow has ended',
        };
    }
    var ret = this._nextTasks.filter(function (task) {
        return task.name === taskName;
    })[0];
    if (!ret) {
        throw {
            code: 'INVALID_TASK',
            message: 'invalid task ' + taskName,
        };
    }
    return ret;
};

Workflow.prototype.deny = function (taskName, operatorId, bundle) {
    taskName = taskName.toUpperCase();
    var task = this.assertTask(taskName);

    task.operatorId = operatorId;
    task.timestamp = new Date();

    var self = this;

    return new Promise(function (resolve, reject) {
        (function (cb) {
            task.onDeny? task.onDeny(operatorId, bundle, cb): cb();
        })(function () {
            self._nextTasks = task.rules.filter(function (rule) {
                return rule.to === taskName;
            }).map(function (rule) {
                return _.extend({
                    name: rule.from,
                    bundle: bundle,
                    cause: 'deny',
                }, self.fac.taskDefs[rule.from]);
            });
            self.dumpActions(task, 'deny', operatorId, bundle, function () {
                resolve(self);
            });
        });
    });
};

Workflow.prototype.pass = function (taskName, operatorId, bundle) {
    taskName = taskName.toUpperCase();
    var task = this.assertTask(taskName);

    task.operatorId = operatorId;
    task.timestamp = new Date();

    var self = this;

    return new Promise(function (resolve, reject) {
        (function (cb) {
            task.onPass? task.onPass(operatorId, bundle, cb): cb();
        })(function () {
            self._nextTasks = task.rules.filter(function (rule) {
                return rule.from === taskName;
            }).map(function (rule) {
                return _.extend({
                    name: rule.to,
                    bundle: bundle,
                    cause: 'pass',
                }, self.fac.taskDefs[rule.to]);
            });
            self.dumpActions(task, 'pass', operatorId, bundle, function () {
                resolve(self);
            });
        });
    });
};

Workflow.prototype.dumpActions = function (task, op, operatorId, bundle, cb) {
    var self = this;
    // update the action and create more uncompleted next actions
    Bookshelf.transaction(function (t) {
        var promises = self._nextTasks.map(function (task) {
            models.Action.forge({
                task_name: task.name,
                bundle: JSON.stringify(bundle),
                cause: task.cause,
                workflow_id: self.id,
            }).save(null, { patch: true, transacting: t }).tap(function (model) {
                task.model = model;
            });
        });
        promises.push(task.model.save({ 
            op: op, 
            operator_id: operatorId, 
            timestamp: new Date(),
        }, { patch: true, transacting: t }));
        return Promise.all(promises).then(t.commit);
    }).then(cb);
};

Workflow.prototype.nextTasks = function () {
    return this._nextTasks;
};

Workflow.prototype.init = function (model) {
    var self = this;
    self.model = model;
    self.id = model.get('id');
    self._nextTasks = [];
    return self.model.actions().fetch().then(function (c) {
        c.each(function (model) {
            if (!model.get('op')) {
                self._nextTasks.push(_.extend({
                    name: model.get('task_name'),
                    bundle: model.get('bundle'),
                    operatorId: model.get('operator_id'),
                    model: model,
                    timestamp: model.get('timestamp'),
                }, self.fac.taskDefs[model.get('task_name')]));
            }
        });
        return self;
    });
};

Workflow.prototype.toJSON = function () {
    return {
        id: this.id,
        type: this.model.get('type'),
        nextTasks: this._nextTasks.map(function (task) {
            return {
                name: task.name,
                bundle: task.bundle,
                operatorId: task.operatorId,
                timestamp: task.timestamp,
            };
        }),
    };
};

Workflow.prototype.ended = function (id) {
    return _.any(this._nextTasks, function (task) {
        return task.name === 'END';
    });
};

var Factory = function (name) {
    this.name = name;
    this.taskDefs = {
        'START': {
            name: 'START',
            rules: [],
        },
        'END': {
            name: 'END',
            rules: [],
        }
    };
};

Factory.prototype.task = function (name, onPass, onDeny) {
    name = name.toUpperCase();
    if (name != 'START' && this.taskDefs[name]) {
        throw new Error('task ' + name + ' already exists!');
    }
    this.taskDefs[name] = {
        name: name, 
        onPass: onPass,
        onDeny: onDeny,
        rules: [],
    };
};

Factory.prototype.seq = function (from, to) {
    from = from.toUpperCase();
    to = to.toUpperCase();

    this.taskDefs[from].rules.push({
        type: 'seq',
        from: from,
        to: to,
    });
    this.taskDefs[to].rules.push({
        type: 'seq',
        from: from,
        to: to,
    });
};

Factory.prototype.all = function (fromList, to) {
    // TODO unimplemented
};

Factory.prototype.any = function (fromList, to) {
    // TODO unimplemented
};

Factory.prototype.not = function (form, to) {
    // TODO unimplemented
};

Factory.prototype.gen = function () {
    var ret = new Workflow(this);
    var self = this;
    return Bookshelf.transaction(function (t) {
        return new Promise(function (resolve, reject) {
            models.Workflow.forge({
                type: self.name, 
            }).save(null, { transacting: t }).tap(function (model) {
                ret.model = model;
                ret.id = model.get('id');
            }).then(function (model) {
                models.Action.forge({
                    task_name: 'START',
                    workflow_id: model.get('id'),
                }).save(null, { transacting: t }).tap(function (actionModel) {
                    ret._nextTasks[0].model = actionModel;
                }).then(t.commit);
            });
        });
    }).then(function () {
        return ret;
    });
};

var createWorkflowFactory = function (name, cb) {
    var fac = new Factory(name);
    cb(fac);
    facs[name] = fac;
    return fac;
};

facs = {};

module.exports = {
    createWorkflowFactory: createWorkflowFactory,
    genWorkflow: function (type) {
        return facs[type.toUpperCase()].gen();
    },
    loadWorkflow: function (id) {
        return new Promise(function (resolve, reject) {
            models.Workflow.forge({ id: id }).fetch({ withRelated: 'actions', required: true }).then(function (model) {
                new Workflow(facs[model.get('type')]).init(model).then(function (workflow) {
                    resolve(workflow);
                });
            });
        });
    },
};
