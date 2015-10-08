var workflowEngine = require('./workflow-engine.js');

workflowEngine.createWorkflowFactory('MAIN-PROJECT-WORKFLOW', function (fac) {
    fac.task('预审');
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