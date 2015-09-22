var koa = require('koa');
var router = require('koa-router');
var models = require('./models.js');
var fs = require('mz/fs');

var privateKey = null; 
var publicKey = null;

router.post('/login', function *(next) {
    if (!privateKey) {
        privateKey = yield fs.read
    }
    try {
        var user = models.User.login(this.params.email, this.params.password).toJSON();
        var token = jwt.sign(user, privateKey, {algorithm: 'RS256'});
        user.token = token;
        this.body = user;
    } catch (error) {
        this.body = {
            reason: errors.message,
        };
        this.response.status = 403;
    }
    yield next;
});

var app = koa();


modules.exports = app;
