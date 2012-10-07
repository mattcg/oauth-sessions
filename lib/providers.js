/**
 * Providers interface.
 *
 * @fileOverview
 * @author Matthew Caruana Galizia <m@m.cg>
 */

'use strict';

/*jshint node:true */
/*global exports:true*/

var providers = {};


/**
 * Set a provider.
 *
 * @param {string} provider Provider name
 * @return {Object}
 */
exports.get = function(provider) {
	return providers[provider];
};


/**
 * Set a provider.
 *
 * @param {string} provider Provider name
 * @param {string} options.authEndpoint User-domain URL for handling auth requests
 * @param {string} options.dialogEndpoint OAuth approval dialog URL
 * @param {string} options.tokenEndpoint Token exchange URL
 * @param {string} options.appId
 * @param {string} options.appSecret
 * @param {string} options.scope
 */
exports.set = function(provider, options) {
	providers[provider] = options;
};


/**
 * Set providers in bulk.
 *
 * @parm {string|Object} newProviders Path to JSON file or object keyed by provider name
 */
providers.setAll = function(newProviders) {
	var provider;

	if (typeof newProviders === 'string') {
		newProviders = require(newProviders);
	}

	for (provider in newProviders) {
		if (newProviders.hasOwnProperty(provider)) {
			exports.set(provider, newProviders[provider]);
		}
	}
};