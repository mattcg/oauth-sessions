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

exports.create = function(options) {
	'use strict';
	var sessionManager, sessionNegotiator, storeManager, providerManager;

	if (!options || !options.storeType) {
		throw new TypeError();
	}

	if (options.providerFile) {
		providerManager = ProviderManager.createFromFile(options.providerFile);
	} else if (options.providers) {
		providerManager = new ProviderManager();
		providerManager.setAll(options.providers);
	}

	storeManager      = new (require('./lib/stores/' + options.storeType))(options.storeOptions);
	sessionManager    = new SessionManager(storeManager);
	sessionNegotiator = new SessionNegotiator(providerManager, sessionManager, require('https'));

	return new OAuthSessions(sessionManager, sessionNegotiator);
};