var workflowEngine = require('./workflow-engine.js');
var models = require('./models.js');
var defs = require('./defs.js');
var util = require('util');
var logger = require('./setup-logger.js');


workflowEngine.createWorkflowFactory('MAIN-PROJECT-WORKFLOW', function (fac) {
    fac.task('START', function (user, bundle, next) {
        // generate a todo 
        models.Todo.forge({
            type: defs.TODO_TYPES.PRE_AUDIT,
            summary: util.format('请对用户%s发起的新项目%s进行预审', user.name || user.email, bundle.project.name),
            project_id: bundle.project.id,
            bundle: JSON.stringify(bundle),
            target: 'role.' + defs.ROLE.PPP_CENTER,
            created_at: new Date(),
        }).save().then(next);
    });
    fac.task('预审', function (user, bundle, next) {
        models.Todo.forge({
            type: defs.TODO_TYPES.CHOOSE_CONSULTANT,
            summary: util.format('请对项目%s选择咨询顾问', bundle.project.name),
            project_id: bundle.project.id,
            bundle: JSON.stringify(bundle),
            target: 'user.' + bundle.project.ownerId,
            created_at: new Date(),
        }).save().then(next);
    }, function (user, bundle, next) {
        models.Todo.forge({
            type: defs.TODO_TYPES.PUBLISH,
            summary: util.format('请重新发布项目%s', bundle.project.name),
            project_id: bundle.projectId,
            bundle: JSON.stringify(bundle),
            target: 'user.' + bundle.project.ownerId,
            created_at: new Date(),
        }).save().then(next);
    });
    fac.task('选择咨询公司');
    fac.task('咨询公司接受邀请');
    fac.task('提交实施方案');
    fac.task('实施方案内部审核');
    fac.task('实施方案审核');

    fac.seq('START', '预审');
    fac.seq('预审', '选择咨询公司');
    fac.seq('选择咨询公司', '咨询公司接受邀请');
    fac.seq('咨询公司接受邀请', '提交实施方案');
    fac.seq('提交实施方案', '实施方案内部审核');
    fac.seq('实施方案内部审核', '实施方案审核');
    fac.seq('实施方案审核', 'END');

});

module.exports = workflowEngine;
