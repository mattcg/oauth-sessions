/**
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

'use strict';

/*jshint node:true */

function OAuthSessions(sessionManager, sessionNegotiator) {
	if (!sessionManager || !sessionNegotiator) {
		throw new TypeError();
	}

	this.sessionManager = null;
	this.sessionNegotiator = null;
}

module.exports = OAuthSessions;


/**
 * Automatically set up routing and handling with the chosen middleware.
 *
 * @param {string} middleware
 * @param {Object} [options]
 */
OAuthSessions.prototype.middleware = function(middleware, options) {
	require('./middleware/' + middleware)(options, this);
};