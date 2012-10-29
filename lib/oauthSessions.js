/**
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

'use strict';

/*jshint node:true */

function OAuthSessions(sessionManager, sessionNegotiator, eventEmitter) {
	if (!sessionManager || !sessionNegotiator || !eventEmitter) {
		throw new TypeError();
	}

	this.sessionManager = sessionManager;
	this.sessionNegotiator = sessionNegotiator;
	this.eventEmitter = eventEmitter;
}

module.exports = OAuthSessions;


/**
 * Register an event listener.
 *
 * @param {string} event The event name
 * @param {function} listener The event callback
 */
OAuthSessions.prototype.on = function() {
	this.eventEmitter.on.apply(arguments);
};


/**
 * Automatically set up routing and handling with the chosen middleware.
 *
 * @param {string} middleware
 * @param {Object} [options]
 */
OAuthSessions.prototype.middleware = function(middleware, options) {
	require('./middleware/' + middleware)(options, this);
};