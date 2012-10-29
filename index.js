/**
 * OAuth sessions
 *
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

var
OAuthSessions     = require('./lib/oauthSessions'),
SessionManager    = require('./lib/sessionManager'),
SessionNegotiator = require('./sessionNegotiator'),
ProviderManager   = require('./lib/providerManager');

/*jshint node:true */

/**
 * @param {string} options.logoutPath
 * @param {string} options.providerFile
 * @param {string} options.storeType
 * @param {Object} options.storeOptions
 */
exports.create = function(options) {
	'use strict';
	var sessionManager, sessionNegotiator, storeManager, providerManager, eventEmitter;

	if (!options) {
		options = {};
	}

	if (!options.storeType) {
		options.storeType = 'redis';
	}

	if (options.providerFile) {
		providerManager = ProviderManager.createFromFile(options.providerFile);
	} else if (options.providers) {
		providerManager = new ProviderManager();
		providerManager.setAll(options.providers);
	}

	eventEmitter      = new require('events').EventEmitter();
	storeManager      = new (require('./lib/stores/' + options.storeType))(options.storeOptions);
	sessionManager    = new SessionManager(storeManager, eventEmitter);
	sessionNegotiator = new SessionNegotiator(providerManager, sessionManager, require('https'));

	return new OAuthSessions(sessionManager, sessionNegotiator, eventEmitter);
};