var convict = require('convict');
 
// Define a schema 
var conf = convict({
  env: {
    doc: "The applicaton environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV"
  },
  knexOpts: {
    doc: "knex setup options",
    format: function (val) {
        
    },
    default: {
        client: 'sqlite3',
        connection: {
            filename: './db',
        },
        debug: true
    },
    env: "KNEX_OPTS",
  },
  port: {
      doc: "port",
      format: "port",
      default: 8081,
      env: "PORT",
  },
  privateKey: {
      doc: 'private key',
      format: String,
      default: "private.pem",
  },
  publicKey: {
      doc: 'public key',
      format: String,
      default: "public.pem",
  },
});

var env = conf.get('env');

env != "development" && conf.loadFile('./config/' + env + '.json');
 
// Perform validation 
conf.validate({strict: true});
 
module.exports = conf;
