var koa = require('koa');
var router = require('koa-router')();
var models = require('./models.js');
var config = require('./config.js');
var koaBody = require('koa-body')();
var jwt = require('koa-jwt');
var fs = require('mz/fs');


var privateKey;

router.post('/login', koaBody, function *(next) {
    try {
        var email = this.request.body.email;
        var password = this.request.body.password;
        var user = (yield models.User.login(email, password)).toJSON();
        console.log(user);
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
        this.response.status = 403;
    }
    yield next;
});

var app = koa();
app.use(router.routes()).use(router.allowedMethods());


module.exports = app;
