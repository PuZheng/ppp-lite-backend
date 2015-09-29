var koa = require('koa');
var app = koa();
var router = require('koa-router')();
var parse = require('co-busboy');
var fs = require('mz/fs');
var path = require('path');
var crypto = require('crypto');
var models = require('./models.js');
var knex = require('./setup-knex.js');
var Bookshelf = require('bookshelf')(knex);
var send = require('koa-send');

var md5 = function (s) {
    var hash = crypto.createHash('md5');
    return hash.update(s).digest('hex');
};

router.post('/', function *(next) {

    var parts = parse(this);
    var assets = [];
    var part;
    var filenames = [];
    while ((part = yield parts)) {
        if (part.length) {
            var key = part[0];
            key === 'x-filenames' && (filenames = JSON.parse(part[1]));
        } else {
            var filename = filenames.shift() || part.filename;
            // TODO assure that the file name is unique
            var token = md5(filename + new Date().toISOString()) + path.extname(filename);
            var stream = fs.createWriteStream(path.join(__dirname, 'assets/uploads', token));
            part.pipe(stream);
            console.log('uploading %s -> %s', filename, stream.path);
            assets.push({
                filename: filename,
                token: token,
                path: path.join('assets/uploads', filename)
            });
        }
    }
    assets = yield Bookshelf.transaction(function (t) {
        return Promise.all(assets.map(
            function (asset) {
                return models.Asset.forge({
                    path: asset.path,
                    token: asset.token,
                    filename: asset.filename,
                    created_at: new Date(),
                }).save(null, { transacting: t });
            }
        )).then(t.commit);
    });
    this.body = {
        data: assets.map(function (asset) {
            return asset.toJSON();
        })
    };
    yield next;
}).get(/uploads\/(.*)/, function *(next) {
    try {
        var path_ = path.join('assets/uploads', this.params[0]);
        var asset = yield models.Asset.where({ path: path_ }).fetch({ required: true });
        yield send(this, asset.get('token'), { root: __dirname + '/assets/uploads' });
    } catch (e) {
        if (e.message === 'EmptyResponse') {
            this.response.status = 404;
        } else {
            throw e;
        }
    }
}).delete('/uploads\/(.*)/', function *(next) {
    try {
        var path_ = path.join('assets/uploads', this.params[0]);
        var asset = yield models.Asset.where({ path: path_ }).fetch({ required: true });
        path_ = path.join(__dirname, '/assets/uploads', asset.get('token'));
        console.log('unlink ' + path_);
        yield fs.unlink(path_);
        yield asset.destroy();
        this.body = {id: asset.id};
    } catch (e) {
        if (e.message === 'EmptyResponse') {
            this.response.status = 404;
        } else {
            throw e;
        }
    }
});

app.use(router.routes()).use(router.allowedMethods());


module.exports = app;
