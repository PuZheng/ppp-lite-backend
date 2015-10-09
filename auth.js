var koa = require('koa');
var router = require('koa-router')();
var models = require('./models.js');
var config = require('./config.js');
var koaBody = require('koa-body')();
var jwt = require('koa-jwt');
var fs = require('mz/fs');
var defs = require('./defs.js');

var privateKey;

router.post('/login', koaBody, function *(next) {
    try {
        var email = this.request.body.email;
        var password = this.request.body.password;
        var user = (yield models.User.login(email, password)).toJSON();
        delete user.password;
        if (user.role.name === defs.ROLE.OWNER) {
            user.department = yield models.Department.query().join('TB_USER_DEPARTMENT', 'TB_USER_DEPARTMENT.department_id', 'TB_DEPARTMENT.id').where({'TB_USER_DEPARTMENT.user_id': user.id}).select('TB_DEPARTMENT.id', 'TB_DEPARTMENT.name');
            user.department = user.department && user.department[0];
        }
        privateKey = privateKey || (yield fs.readFile(config.get('privateKey'))).toString(); 
        var token = jwt.sign(user, privateKey, { 
            algorithm: 'RS256'
        });
        user.token = token;
        this.body = user;
    } catch (error) {
        this.body = {
            reason: error.message,
        };
        this.status = 403;
    }
    yield next;
});

module.exports = koa().use(router.routes())
.use(router.allowedMethods());
