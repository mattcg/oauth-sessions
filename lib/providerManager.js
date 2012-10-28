/**
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

'use strict';

/*jshint node:true */
/*global exports:true*/

function ProviderManager() {
	this.providers = {};
}

module.exports = ProviderManager;


/**
 * Create a ProviderManager from a JSON config file.
 *
 * @param {string} filepath Path to JSON config file
 * @return {ProviderManager}
 */
ProviderManager.createFromFile = function(filepath) {
	var providerManager = new ProviderManager();

	providerManager.setAll(require(filepath));
	return providerManager;
};


/**
 * Set a provider.
 *
 * @param {string} provider Provider name
 * @return {Object}
 */
ProviderManager.prototype.get = function(provider) {
	return this.providers[provider];
};


/**
 * Set a provider.
 *
 * @param {string} provider Provider name
 * @param {string} options.redirectUri The full redirection URI, including scheme and trailing slash
 * @param {string} options.dialogEndpoint OAuth approval dialog URL
 * @param {string} options.tokenEndpoint Token exchange URL
 * @param {string} options.appId
 * @param {string} options.appSecret
 * @param {string} options.scope
 */
ProviderManager.prototype.set = function(provider, options) {
	this.providers[provider] = {
		redirectUri:    options.redirectUri,
		dialogEndpoint: options.dialogEndpoint,
		tokenEndpoint:  options.tokenEndpoint,
		appId:          options.appId,
		appSecret:      options.appSecret,
		scope:          options.scope || ''
	};
};


/**
 * Set providers in bulk.
 *
 * @parm {Object} newProviders Object keyed by provider name
 */
ProviderManager.prototype.setAll = function(newProviders) {
	var provider;
	for (provider in newProviders) {
		if (newProviders.hasOwnProperty(provider)) {
			exports.set(provider, newProviders[provider]);
		}
	}
};