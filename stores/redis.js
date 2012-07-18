/**
 * Redis storage engine for oauth-sessions.
 *
 * @fileOverview
 * @author Matthew Caruana Galizia <m@m.cg>
 */

'use strict';

/*jshint node:true */

var client;


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
 * @param {function} successCallback
 * @param {function} errorCallback
 */
exports.checkSession = function(sessionId, successCallback, errorCallback) {
	client.ttl('sessions:' + sessionId, function(err, reply) {
		if (err) {
			errorCallback(err);
		} else {
			successCallback(reply);
		}
	});
};


/**
 * Initialize a session before the authentication token is available. This must be done before beginSession is called.
 *
 * @param {string} providerName
 * @param {string} sessionId
 * @param {number} expiresIn
 * @param {function} successCallback
 * @param {function} errorCallback
 */
exports.initSession = function(providerName, sessionId, expiresIn, successCallback, errorCallback) {
	var key = 'sessions:' + sessionId;

	client.multi([
		['hset', key, 'provider', providerName],
		['expires', key, expiresIn]
	]).exec(function(err, replies) {
		if (err || !replies || replies[1] !== 1) {
			errorCallback(err);
		} else {
			successCallback();
		}
	});
};


/**
 * Begin a session when the authenication token is available.
 *
 * @param {string} sessionId
 * @param {string} accessToken
 * @param {number} expiresIn
 * @param {function} successCallback
 * @param {function} errorCallback
 */
exports.beginSession = function(sessionId, accessToken, expiresIn, successCallback, errorCallback) {
	var key = 'sessions:' + sessionId;

	client.multi([
		['hset', key, 'token', accessToken],
		['expires', key, expiresIn]
	]).exec(function(err, replies) {
		if (err || !replies || replies[1] !== 1) {
			errorCallback(err);
		} else {
			successCallback();
		}
	});
};


/**
 * End a session.
 *
 * @param {string} sessionId
 * @param {function} successCallback
 * @param {function} errorCallback
 */
exports.endSession = function(sessionId, successCallback, errorCallback) {
	client.del('sessions:' + sessionId, function(err) {
		if (err) {
			errorCallback(err);
		} else {
			successCallback();
		}
	});
};