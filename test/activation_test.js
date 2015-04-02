"use strict";
var usvc = require('usvc');

var debug = require('debug')('test:activation');

var expect = require('chai').expect;

describe('cloud modelstore', function () {

  var service = usvc.microService({
    // bus connections
    amqp: usvc.facets.msg.amqp(),

    // database connections
    redis: usvc.facets.db.redis(),
    mysql: usvc.facets.db.mysqlPool(),

    // rpc interface
    rpcService: usvc.facets.rpc.jsonServer(['activationService']),
    activationService: require('../lib/rpc'),

    // used for testing
    activationClient: usvc.facets.rpc.jsonClient()
  });

  before(function () {
    service.run();
  });

  it('should activate a sphere');

  it('should list activated nodes', function(){
    return service.facet('activationClient').delay(10).then(function (facet) {

      function listUserActivatedNodes(results) {
        debug('results', results);
        expect(results.length).to.equal(0);
      }

      facet.call(
        'activation.listUserActivatedNodes', '343f84cb-c137-4db1-aeab-8a985e9f7414'
      ).then(listUserActivatedNodes);
    });

  });

});