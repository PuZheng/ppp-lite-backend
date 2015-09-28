var koa = require('koa');
var app = koa();
var router = require('koa-router')();
var parse = require('co-busboy');
var fs = require('fs');
var path = require('path');

router.post('/', function *(next) {

    var parts = parse(this);
    var pathList = [];
    var part;
    while ((part = yield parts)) {
        var stream = fs.createWriteStream(path.join(__dirname, 'assets/uploads', part.filename));
        part.pipe(stream);
        console.log('uploading %s -> %s', part.filename, stream.path);
        pathList.push(path.join('assets/uploads', part.filename));
    }
    this.body = {
        paths: pathList
    };
    yield next;
}).get(/\/assets\/(.*)/, function *(next) {
    yield send(this, this.params[0], { root: __dirname + '/assets' });
});

app.use(router.routes()).use(router.allowedMethods());


module.exports = app;
