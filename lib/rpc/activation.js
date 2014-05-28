'use strict';

var debug = require('debug')('sphere:activation');
var when = require('when');
var errors = require('./errors');
var uuid = require('uuid');
var crypto = require('crypto');


var nodeRegex = /^[a-z0-9]{6,254}$/i;

function validateNodeId(nodeId) {
  if (!nodeId ||
      typeof nodeId !== "string" ||
      nodeId.length < 6 ||
      nodeId.length > 254 ||
      !nodeRegex.test(nodeId)) {

    return false;
  }
  return true;
}

module.exports.nodeAwaitingActivation = function(nodeId) {
  if (!validateNodeId(nodeId)) {
    throw errors.activation.invalid_serial;
  }

  return this.service.facet('redis').then(function(redis) {
    return retryAtInterval(function(deferred) {
      return redis.client.get('node:'+nodeId+':claim').then(function(value) {
        if (!value) return false; // not done yet.

        var claim = JSON.parse(value);

        debug('node claim', claim);

        // otherwise we have a user requesting us!
        return redis.client.setex('node:'+nodeId+':'+claim.user_id+':claimed', 20, true).then(function() {
          return when.all([
            redis.client.del('node:'+nodeId+':claim'),
            addClaimedNode.call(this, claim),
          ]);
        }.bind(this)).then(function() {
          deferred.resolve(claim);
          return true;
        });
      }.bind(this));
    }.bind(this), 500, 20000); // 500ms polling, 20s timeout
  }.bind(this));
};

module.exports.userClaimingNode = function(user, nodeId) {
  if (!validateNodeId(nodeId)) {
    throw errors.activation.invalid_serial;
  }

  // FIXME: add user locking

  return when.all([
    ensureUser.call(this, user),
    ensureDefaultSite.call(this, user),
    newToken(),
    this.service.facet('redis'),
  ]).spread(function(_user, site_id, new_token, redis) {
    var claim = JSON.stringify({user_id: user.id, site_id: site_id, node_id: nodeId, token: new_token});
    debug('user claim', claim);
    return redis.client.setex('node:'+nodeId+':claim', 20, claim).then(function() {
      return retryAtInterval(function(deferred) {
        return redis.client.get('node:'+nodeId+':'+user.id+':claimed').then(function(value) {
          if (!value) return false; // not done yet.

          // otherwise a node has claimed us!
          return redis.client.del('node:'+nodeId+':'+user.id+':claimed').then(function() {
            deferred.resolve({user_id: user.id, site_id: site_id, node_id: nodeId});
            return true;
          });
        });
      }.bind(this), 500, 20000); // 500ms polling, 20s timeout
    });
  });
};

module.exports.userDeactivateNode = function(user, nodeId) {
  if (!validateNodeId(nodeId)) {
    throw errors.activation.invalid_serial;
  }

  // FIXME: 404 if the node isn't activated
  // FIXME: kick off the node as well?
  return removeNode.call(this, user.id, nodeId).then(function() {
    return {success: true};
  });
};

function ensureUser(user) {
  var sql = 'INSERT INTO `users` (user_id, name, email, lastAccessToken) ' +
    'VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE name=?, email=?, lastAccessToken=?;';

  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query(sql, [user.id, user.name, user.email, user.accessToken,
                             user.name, user.email, user.accessToken]);
  });
}

function ensureDefaultSite(user) {
  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query('SELECT site_id FROM `sites` WHERE user_id=?;', [user.id]).then(function(results) {
      if (results.length > 0) {
        return results[0].site_id;
      } else {
        var site_id = uuid.v4();
        return mysql.query('INSERT INTO `sites` (user_id, site_id) VALUES (?,?)', [user.id, site_id]).then(function() {
          return site_id;
        });
      }
    });
  });
}

function addClaimedNode(claim) {
  var sql = 'INSERT INTO `nodes` (user_id, site_id, node_id, token) VALUES (?,?,?,?);';

  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query(sql, [claim.user_id, claim.site_id, claim.node_id, claim.token]);
  }).catch(function(err) {
    throw errors.activation.already_activated;
  });
}

function removeNode(user_id, node_id) {
  var sql = 'DELETE FROM `nodes` WHERE user_id=? AND node_id=? LIMIT 1;';

  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query(sql, [user_id, node_id]);
  });
}

function newToken() {
  var deferred = when.defer();

  crypto.randomBytes(24, function(err, buf) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(buf.toString('hex'));
    }
  });

  return deferred.promise;
}

function retryAtInterval(doneYet, interval, timeout) {
  var deferred = when.defer();

  var timedOut = false;

  when.iterate(doneYet.bind(undefined, deferred), function(finished) {
    return finished || timedOut;
  }, function(finished) {
    return when(finished).delay(500);
  }, false)
  .done(function(final) {
    if (!timedOut && !final) deferred.reject(errors.activation.timeout);
  }, function(err) {
    console.error(err);
    if (!timedOut) {
      if (err.code && err.message) {
        deferred.reject(err);
      } else {
        deferred.reject(errors.unknown_error);
      }
    }
  });

  var cancel = function() {
    if (!timedOut) {
      timedOut = true;
      deferred.reject(errors.activation.timeout);
    }
  };

  // after 20 seconds, disable the poller
  setTimeout(cancel, 20000);

  return deferred.promise;
}
