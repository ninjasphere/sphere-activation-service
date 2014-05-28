process.title = 'sphere-activation-service';

var usvc = require('usvc');

var service = usvc.microService({
  // database connections
  redis: usvc.facets.db.redis(),
  mysql: usvc.facets.db.mysqlPool(),

  // rpc interface
  rpcService: usvc.facets.rpc.jsonServer(['activationService']),
  activationService: require('./lib/rpc'),
}).run();
