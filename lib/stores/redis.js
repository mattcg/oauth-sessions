/**
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

'use strict';

/*jshint node:true */

var Session = require('../session');


/**
 * Create a redis client.
 *
 * @param {Object} [options]
 */
function RedisStoreManager(options) {
	var port, host;

	port = options && options.port;
	host = options && options.host;

	this.prefix = '$';
	this.client = require('redis').createClient(port, host, options);
	if (options && options.password) {
		this.client.auth(options.password);
	}
}

module.exports = RedisStoreManager;


/**
 * Check whether a session exists. The success callback is invoked with a TTL in seconds, or -1 if the session doesn't exist.
 *
 * @param {string} sessionId
 * @param {function} callback
 */
RedisStoreManager.prototype.checkSession = function(sessionId, callback) {
	this.client.ttl(this.prefix + sessionId, callback);
};


/**
 * Get session data. Currently an object with 'p' (provider) and 't' (token) keys.
 *
 * @param {string} sessionId
 * @param {function} Session Session object constructor
 * @param {function} callback
 */
RedisStoreManager.prototype.getSession = function(sessionId, Session, callback) {
	var key = this.prefix + sessionId;

	this.client.multi([
		['hgetall', key],
		['ttl', key]
	]).exec(function(err, replies) {
		var session;

		if (err || replies[1] < 1) {
			callback(err);
		} else {
			session = new Session(replies[0].p, sessionId);
			session.token = replies[0].t;
			session.ttl   = replies[1];

			callback(null, session);
		}
	});
};


/**
 * Initialize a session before the authentication token is available. This must be done before beginSession is called.
 *
 * @param {Session} session
 * @param {function} callback
 */
RedisStoreManager.prototype.initSession = function(session, callback) {
	var key = this.prefix + session.id;

	this.client.multi([
		['hset', key, 'p', session.provider],
		['expires', key, session.ttl]
	]).exec(callback);
};


/**
 * Begin a session when the authenication token is available.
 *
 * @param {Session} session
 * @param {function} callback
 */
RedisStoreManager.prototype.beginSession = function(session, callback) {
	var key = this.prefix + session.id;

	this.client.multi([
		['hset', key, 't', session.token],
		['expires', key, session.ttl]
	]).exec(callback);
};


/**
 * End a session.
 *
 * @param {string} sessionId
 * @param {function} callback
 */
RedisStoreManager.prototype.endSession = function(sessionId, callback) {
	this.client.del(this.prefix + sessionId, callback);
};