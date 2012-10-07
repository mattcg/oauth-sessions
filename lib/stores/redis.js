/**
 * Redis storage engine for oauth-sessions.
 *
 * @fileOverview
 * @author Matthew Caruana Galizia <m@m.cg>
 */

'use strict';

/*jshint node:true */

var client, prefix = '$:';


/**
 * Create a redis client.
 *
 * @param {number} port
 * @param {string} host
 * @param {Object} [options]
 */
exports.createClient = function(port, host, options) {
	client = require('redis').createClient(port, host, options);
	if (options && options.password) {
		client.auth(options.password);
	}
};


/**
 * Check whether a session exists. The success callback is invoked with a TTL in seconds, or -1 if the session doesn't exist.
 *
 * @param {string} sessionId
 * @param {function} callback
 */
exports.checkSession = function(sessionId, callback) {
	client.ttl(prefix + sessionId, callback);
};


/**
 * Get session data. Currently an object with 'p' (provider) and 't' (token) keys.
 *
 * @param {string} sessionId
 * @param {function} callback
 */
exports.getSession = function(sessionId, callback) {
	client.hgetall(prefix + sessionId, function(err, data) {
		callback(err, err ? null : {
			provider: data.p,
			token:    data.t,
			id:       sessionId
		});
	});
};


/**
 * Initialize a session before the authentication token is available. This must be done before beginSession is called.
 *
 * @param {string} providerName
 * @param {string} sessionId
 * @param {number} expiresIn
 * @param {function} callback
 */
exports.initSession = function(providerName, sessionId, expiresIn, callback) {
	var key = prefix + sessionId;

	client.multi([
		['hset', key, 'p', providerName],
		['expires', key, expiresIn]
	]).exec(callback);
};


/**
 * Begin a session when the authenication token is available.
 *
 * @param {string} sessionId
 * @param {string} accessToken
 * @param {number} expiresIn
 * @param {function} callback
 */
exports.beginSession = function(sessionId, accessToken, expiresIn, callback) {
	var key = prefix + sessionId;

	client.multi([
		['hset', key, 't', accessToken],
		['expires', key, expiresIn]
	]).exec(callback);
};


/**
 * End a session.
 *
 * @param {string} sessionId
 * @param {function} callback
 */
exports.endSession = function(sessionId, callback) {
	client.del(prefix + sessionId, callback);
};