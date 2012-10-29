/**
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

'use strict';

/*jshint node:true */

var
Session = require('./session'),
uuid    = require('node-uuid');

function SessionManager(storeManager, eventEmitter) {
	if (!storeManager || !eventEmitter) {
		throw new TypeError();
	}

	this.storeManager = storeManager;
	this.eventEmitter = eventEmitter;
}

module.exports = SessionManager;


/**
 * Retrieve an existing session from storage.
 *
 * @param {string} id
 * @param {function} callback
 */
SessionManager.prototype.retrieve = function(id, callback) {
	this.storeManager.getSession(id, Session, callback);
};


/**
 * End a session.
 *
 * @param {function} callback Receives the session ID as the second argument, error as first
 */
SessionManager.prototype.kill = function(id, callback) {
	this.storeManager.endSession(id, callback && function(err) {
		if (!err) {
			this.eventEmitter.emit('kill', id);
		}

		callback(err, id);
	});
};


/** 
 * Actually begin a session that has been initialized.
 *
 * @param {Session} session
 * @param {function} callback
 */
SessionManager.prototype.begin = function(session, callback) {
	this.storeManager.beginSession(session, callback && function(err) {
		if (!err) {
			this.eventEmitter.emit('begin', session);
		}

		callback(err, session);
	});
};


/**
 * Create and initialize a completely new session.
 *
 * Implicitly creates a new ID and assigns it to the session. Note that the user has one day to approve authentication.
 *
 * @param {string} provider
 * @param {function} callback Will be called with any error and the session
 */
SessionManager.prototype.create = function(provider, callback) {
	var session = new Session(provider);

	session.id  = uuid.v4({rng: uuid.nodeRNG});
	session.ttl = 86400;

	this.storeManager.initSession(session, callback && function(err) {
		if (err) {
			callback(err, session);
		} else {

			// Call the success callback with the session
			callback(err, session);
		}
	});
};