/**
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

'use strict';

/*jshint node:true */

var querystring = require('querystring');

function SessionNegotiator(providerManager, sessionManager, httpClient) {
	if (!providerManager || !sessionManager || !httpClient) {
		throw new TypeError();
	}

	this.httpClient = httpClient;
	this.providerManager = providerManager;
	this.sessionManager = sessionManager;
}

module.exports = SessionNegotiator;


/**
 * Get the URI that a client should be redirected too to view the provider dialog.
 *
 * @param {Session} session
 * @return {string}
 */
SessionNegotiator.prototype.getDialogUri = function(session) {
	var providerOpts = this.providerManager.get(session.provider), enc = encodeURIComponent;

	return providerOpts.dialogEndpoint +
		'?scope='        + enc(providerOpts.scope) +
		'&client_id='    + enc(providerOpts.appId) +
		'&redirect_uri=' + enc(providerOpts.redirectUri) +
		'&state='        + enc(session.id);
};


/**
 * Exchange a code for a token with the provider.
 *
 * @param {Session} session
 * @param {string} code
 * @param {function} callback
 */
SessionNegotiator.prototype.exchangeToken = function(session, code, callback) {
	var that = this, providerOpts = this.providerManager.get(session.provider), enc = encodeURIComponent;

	this.httpClient.get(providerOpts.tokenEndpoint +
		'?client_id='     + enc(providerOpts.appId) +
		'&redirect_uri='  + enc(providerOpts.redirectUri) +
		'&client_secret=' + enc(providerOpts.appSecret) +
		'&code='          + enc(code),
	function(res) {
		var tokenData = '';

		if (res.statusCode !== 200) {
			callback(res, session); // Pass the response as the error object
			return;
		}

		res.setEncoding('ascii');
		res.on('data', function(chunk) {
			tokenData += chunk;
		});

		res.on('end', function() {
			tokenData     = querystring.parse(tokenData);
			session.ttl   = tokenData.expires || tokenData.expires_in;
			session.token = tokenData.access_token;

			that.sessionManager.check(session.id, function(err, ttl) {
				if (!err && ttl > 0) {
					that.sessionManager.begin(session, function(err) {
						callback(err, session);
					});
				} else {
					callback(err, session);
				}
			});
		});
	}).on('error', function(err) {
		callback(err, session);
	});
};