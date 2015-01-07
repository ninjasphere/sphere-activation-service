'use strict';

var debug = require('debug')('sphere:activation');
var when = require('when');
var errors = require('./errors');
var uuid = require('uuid');
var crypto = require('crypto');
var sequence = require('when/sequence');

var nodeRegex = /^[a-z0-9]{6,254}$/i;
var masterNodeHardwareType = 'custom-linux-arm';


function validateNodeId(nodeId) {
  if (!nodeId ||
      typeof nodeId !== 'string' ||
      nodeId.length < 6 ||
      nodeId.length > 254 ||
      !nodeRegex.test(nodeId)) {

    return false;
  }
  return true;
}

module.exports.nodeAwaitingActivation = function(nodeId, metaData) {
  metaData = metaData || {};

  if (!validateNodeId(nodeId)) {
    throw errors.activation.invalid_serial;
  }

  return this.service.facet('redis').then(function(redis) {
    return retryAtInterval(function(deferred) {
      return redis.client.get('node:'+nodeId+':claim').then(function(value) {
        if (!value) return false; // not done yet.

        var claim = JSON.parse(value);

        debug('node claim', claim);
        var nodeMetadata = JSON.stringify(metaData);

        // otherwise we have a user requesting us!
        return redis.client.setex('node:'+nodeId+':'+claim.user_id+':claimed', 20, nodeMetadata).then(function() {
          return when.all([
            redis.client.del('node:'+nodeId+':claim'),
            addClaimedNode.call(this, claim, metaData)
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
    ensureDefaultSite.call(this, user, nodeId),
    newNodeToken(),
    this.service.facet('redis')
  ]).spread(function(sphere_network_key, site_id, new_token, redis) {
    var claim = JSON.stringify({
      user_id: user.id,
      site_id: site_id,
      node_id: nodeId,
      token: new_token,
      sphere_network_key: sphere_network_key
    });
    debug('user claim', claim);
    return redis.client.setex('node:'+nodeId+':claim', 20, claim).then(function() {
      return retryAtInterval(function(deferred) {
        return redis.client.get('node:'+nodeId+':'+user.id+':claimed').then(function(value) {
          if (!value) return false; // not done yet.

          var nodeMetadata = JSON.parse(value);
          debug('node metadata', nodeMetadata);

          // otherwise a node has claimed us!
          return redis.client.del('node:'+nodeId+':'+user.id+':claimed').then(function() {
            deferred.resolve({user_id: user.id, site_id: site_id, node_id: nodeId, sphere_network_key: sphere_network_key, metadata: nodeMetadata});
            return true;
          });
        });
      }.bind(this), 500, 20000); // 500ms polling, 20s timeout
    });
  });
};

module.exports.listUserActivatedNodes = function(user) {
  return listNodes.call(this, user.id).then(function(results) {
    return results.map(function(result) {
      return {
        type: 'node',
        node_id: result.node_id,
        site_id: result.site_id
      };
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

module.exports.userPromoteNode = function(user, siteId, nodeId) {
  if (!validateNodeId(nodeId)) {
    throw errors.activation.invalid_serial;
  }

  return promoteNode.call(this, user.id, siteId, nodeId).then(getSite.call(this, user.id, siteId)).then(function(results) {
    return results
  });
};

module.exports.listSites = function(user) {
  return listSites.call(this, user.id).then(function(results) {
    return results
  });
};

module.exports.getSite = function(user, siteId) {
  return getSite.call(this, user.id, siteId).then(function(results) {
    return results
  });
};

function ensureUser(user) {

  // assign a sphere token to the user, this will only be inserted
  // on the first ensureUser.
  var sphereTokenP = newSphereToken();

  var sql = 'INSERT INTO `users` (user_id, name, email, lastAccessToken, sphere_network_key) ' +
    'VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE name=?, email=?, lastAccessToken=?;';

  return when.all([
    this.service.facet('mysql'), sphereTokenP
  ]).spread(function(mysql, sphereToken) {
    return mysql.query(sql, [user.id, user.name, user.email, user.accessToken, sphereToken,
      user.name, user.email, user.accessToken]).then(function () {
      return mysql.query('SELECT sphere_network_key FROM `users` where user_id=?', [user.id]).then(function (results) {
        return results[0].sphere_network_key;
      });
    });
  });
}

function ensureDefaultSite(user, node_id) {
  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query('SELECT site_id FROM `sites` WHERE user_id=?;', [user.id]).then(function(results) {
      if (results.length > 0) {
        return results[0].site_id
      } else {
        var site_id = uuid.v4();
        return mysql.query('INSERT INTO `sites` (user_id, site_id) VALUES (?,?)', [user.id, site_id]).then(function() {
          return site_id;
        });
      }
    });
  });
}

function promoteNode(user_id, site_id, node_id) {
  var sql = 'UPDATE `sites` SET `master_node_id` = ? WHERE site_id = ? AND user_id = ? AND master_node_id IS NULL;';
  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query(sql, [node_id, site_id, user_id]).then(function(){
      return site_id;
    });
  });
}

/*
 * When a node is paired the oldest one is assigned master if one is NOT set and it matches the hardware_type
 *
 * TODO: May need to change masterNodeHardwareType to an array and map over it to select a master.
*/
function ensureFirstSphereSetup(user_id, site_id, node_id) {
  var sql = 'UPDATE `sites` SET `master_node_id` = (SELECT `node_id` FROM `nodes` WHERE hardware_type = ? AND site_id = ? AND user_id = ? ORDER BY `updated` ASC LIMIT 1) WHERE site_id = ? AND user_id = ? AND master_node_id IS NULL;';
  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query(sql, [masterNodeHardwareType, site_id, user_id, site_id, user_id]).then(function(){
      return site_id;
    });
  });
}

function addClaimedNode(claim, metaData) {
  // start by adding the node in the activation db
  var hardware_type = metaData.hardware_type || 'unknown';
  var nodeSQL = 'INSERT INTO `nodes` (user_id, site_id, node_id, hardware_type) VALUES (?,?,?,?);';
  var nodeAdded = this.service.facet('mysql').then(function(mysql) {
    return mysql.query(nodeSQL, [claim.user_id, claim.site_id, claim.node_id, hardware_type]).then(
      ensureFirstSphereSetup.call(this, claim.user_id, claim.site_id, claim.node_id)
    );
  }.bind(this));

  var scopeIdMP = newToken('scope_');
  var scopeIdAP = newToken('scope_');

  // now provision the access token in the douitsu database for this node
  // FIXME: eventually this should be migrated into douitsu as an RPC
  var tokenAdded = when.all([scopeIdMP, scopeIdAP, nodeAdded]).spread(function(scopeIdM, scopeIdA) {
    return this.service.facet('idMysql').then(function(mysql) {
      return mysql.transaction(function(transaction) {
        debug('transaction', transaction);
        return sequence([
          function() {
            // FIXME: this accesstoken should be pinned to an oauth clientID for MQTT+API access
            // (not just mqtt-proxy because the token can be used for both API+MQTT, it's sort of
            // an arbitrary "External Access" oauth client). For now, I'm leaving these NULL.
            var clientID = '';
            var clientName = '';
            var tokenSQL = 'INSERT INTO `accesstoken` (id, userID, type, node_id, clientID, clientName) VALUES (?,?,?,?,?,?);';
            return transaction.query(tokenSQL, [claim.token, claim.user_id, 'node', claim.node_id, clientID, clientName]);
          },
          function() {
            var scopeSQL = 'INSERT INTO `accesstoken_scope`' +
              ' (id, accesstoken, scope_domain, scope_item)' +
              ' VALUES (?,?,?,?),(?,?,?,?);';
            return transaction.query(scopeSQL, [
              // nodes can access MQTT
              scopeIdM, claim.token, 'mqtt', '*',
              // blocks can also access the REST API
              scopeIdA, claim.token, 'api', '*'
            ]);
          }
        ]);
      });
    });
  }.bind(this));

  return tokenAdded.catch(function(err) {
    if (err && err.code && err.code === 'ER_DUP_ENTRY') {
      throw errors.activation.already_activated;
    } else {
      debug('error', err);
      throw errors.internal_error;
    }
  });
}

function listNodes(user_id) {
  var sql = 'SELECT * FROM `nodes` WHERE user_id=?;';

  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query(sql, [user_id]);
  });
}

function removeNode(user_id, node_id) {
  var sql = 'DELETE FROM `nodes` WHERE user_id=? AND node_id=? LIMIT 1;';
  var masterSiteUpdate = 'UPDATE `sites` SET master_node_id = NULL where master_node_id = ? AND user_id = ?';
  return this.service.facet('mysql').then(function(mysql) {
    return when.all([
      mysql.query(sql, [user_id, node_id]),
      mysql.query(masterSiteUpdate, [user_id, node_id]) // IF the user_id and node_id match then remove the master
    ])
  });
}

function listSites(user_id) {
  var sql = 'SELECT * FROM `sites` WHERE user_id=?;';
  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query(sql, [user_id]);
  });
}

function getSite(user_id, site_id) {
  var sql = 'SELECT * FROM `sites` WHERE user_id=? AND site_id=? LIMIT 1;';
  return this.service.facet('mysql').then(function(mysql) {
    return mysql.query(sql, [user_id, site_id]).then(function(results) {
      if (results.length > 0) {
        return results[0];
      } else {
        throw errors.activation.site_not_found;
      }
    });
  });
}

function newToken(prefix) {
  var deferred = when.defer();

  crypto.randomBytes(24, function(err, buf) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(prefix + buf.toString('hex'));
    }
  });

  return deferred.promise;
}

function newNodeToken() {
  return newToken('ntok_');
}

function newSphereToken() {
  return newToken(''); // used in encryption of data so not wise to have a constant prefix string because security.
}

function retryAtInterval(doneYet, interval, timeout) {
  var deferred = when.defer();

  var timedOut = false;

  when.iterate(doneYet.bind(undefined, deferred), function(finished) {
    return finished || timedOut; // should stop?
  }, function(finished) {
    if (finished || timedOut) return finished; // regardless of why we stopped, don't delay
    return when(finished).delay(500); // otherwise wait and try again
  }, false)
  .done(function(final) {
    if (timedOut || !final) deferred.reject(errors.activation.timeout);
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
    }
  };

  // after 20 seconds, disable the poller
  setTimeout(cancel, 20000);

  return deferred.promise;
}
