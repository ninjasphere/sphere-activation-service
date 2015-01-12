'use strict';

var debug = require('debug')('block-service:rpc');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var when = require('when');

function BlockServiceFacet(service, name) {
  this.service = service;
  this.name = name;
}
util.inherits(BlockServiceFacet, EventEmitter);

BlockServiceFacet.prototype.initialise = function() {
  return this.service.facets('redis', 'mysql', 'amqp').spread(function(redis, mysql, amqp) {
    debug('got dependency', redis.name);
    debug('got dependency', mysql.name);
    debug('got dependency', amqp.name);
  });
};

BlockServiceFacet.prototype.rpc_methods = {};

BlockServiceFacet.prototype.rpc_methods.activation = require('./activation');
BlockServiceFacet.prototype.rpc_methods.authentication = require('./tmp_authentication');

module.exports = BlockServiceFacet;
