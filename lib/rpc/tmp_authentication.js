'use strict';

var debug = require('debug')('sphere:authentication');
var errors = require('./errors');
var jwt = require('jsonwebtoken');
var whennode = require('when/node');
var when = require('when');

var jwtVerify = whennode.lift(jwt.verify.bind(jwt));

/**
 * THIS PROBABLY SHOULD TO BE MIGRATED TO DOUITSU
 * It is only here because it is easier to implement as part of usvc at the moment,
 * and because this service is already provisioned next to douitsu.
 */

function getAppSigningSecret(app) {
  var signing_options = app.service.config.get('apiJWT');
  if (!signing_options || !signing_options.secret) {
    throw errors.internal_error;
  }
  return signing_options.secret;
}

/**
 * Validate some form of authorization/access/bearer token.
 *
 * Returns the user object of the authorized user: {user: {id: ...}}
 */
module.exports.validateAccessToken = function(accessToken, scopeRequired) {
  scopeRequired = scopeRequired || '*';

  if (accessToken.indexOf('stok_') === 0) {
    // validate JWT session tokens
    var jwtEncoded = accessToken.substring('stok_'.length);
    
    var secret = getAppSigningSecret(this);    

    return when.try(jwtVerify, jwtEncoded, secret).then(function(decoded) {
      return {
        user: decoded.user
      };
    }).catch(function() {
      throw errors.authentication.invalid_token;
    });
  } else {
    // otherwise it's a Bearer token, look it up in the token table
    return this.service.facet('idMysql').then(function(mysql) {
      var scopeParts = scopeRequired.split(':');
      var scopeDomain = scopeParts[0];
      var scopeItem = (scopeParts.length > 1 ? scopeParts[1] : '*');

      return mysql.query('SELECT a.userID, u.name, u.email' +
        ' FROM `accesstoken` a' +
        ' JOIN `accesstoken_scope` s ON s.accesstoken=a.id' +
        ' JOIN `sys_user` u ON u.id=a.userID' +
        ' WHERE a.id=?' +
        '   AND s.scope_domain IN (\'*\', ?)' +
        '   AND s.scope_item IN (\'*\', ?)' +
        ' LIMIT 1; ',
        [accessToken, scopeDomain, scopeItem]);
    }).then(function(result) {
      if (result.length != 1) {
        throw errors.authentication.invalid_token;
      } else {
        var details = result[0];
        return {
          user: {
            id: details.userID,
            name: details.name,
            email: details.email,
          }
        };
      }
    });
  }
};

/**
 * Generates a temporary session token that can be used for a short period.
 * It is signed, and validateAccessToken will accept these as well as oauth
 * tokens.
 *
 * NOTE: It is assumed the internal service has ALREADY authenticated the user
 * using validateAccessToken or similar. This just translate a "hard" token
 * to a temporary session one.
 */
module.exports.generateSignedSessionToken = function(user, scope) {
  if (!user || !user.id || !user.name || !user.email) {
    throw errors.authentication.invalid_user;
  }

  var raw_data = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };

  var secret = getAppSigningSecret(this);

  return 'stok_' + jwt.sign(raw_data, secret, {
    issuer: 'sphere-activation-service',
    expiresInMinutes: 24*60
  });
};
