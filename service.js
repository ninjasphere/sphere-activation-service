process.title = 'sphere-activation-service';

if (process.env.BUGSNAG_KEY) {
  var bugsnag = require("bugsnag");
  bugsnag.register(process.env.BUGSNAG_KEY, { releaseStage: process.env.USVC_CONFIG_ENV || 'development' });
}

var usvc = require('usvc');

var service = usvc.microService({
  // database connections
  redis: usvc.facets.db.redis(),
  mysql: usvc.facets.db.mysqlPool(),

  idMysql: usvc.facets.db.mysqlPool(),

  // rpc interface
  rpcService: usvc.facets.rpc.jsonServer(['activationService']),
  activationService: require('./lib/rpc'),

  // external rest api
  frontendRest: usvc.facets.web.express(require('./lib/web'))
}).run();
