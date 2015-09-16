#! /usr/bin/env node
var fs = require('fs');
var q = require('q');

function clearDB(knex) {
    return q.nfcall(fs.unlink, './db');
}
module.exports = clearDB;

if (require.main === module) {
    var unlink = q.denodeify(fs.unlink);
    clearDB().catch(function (err) {
        if (err.code != 'ENOENT') {
            throw err; 
        }
        console.log('no such db');
    }).done(function () {
    });
}
