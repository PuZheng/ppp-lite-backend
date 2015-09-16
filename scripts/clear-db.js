var fs = require('fs');
var q = require('q');

function clearDB() {
    return q.nfcall(fs.unlink, './db');
}
module.exports = clearDB;

if (require.main === module) {
    var knex = require('../setup-knex.js');
    clearDB(knex).done(function () {
        knex.destroy();
    });
}
