/**
 * OAuth sessions.
 *
 * @fileOverview
 * @module oauth-sessions
 * @author Matthew Caruana Galizia <m@m.cg>
 */

'use strict';

/*jshint node:true */
/*global exports:true*/

var

EventEmitter = require('events').EventEmitter,
querystring = require('querystring'),
// cookie = require('cookie'), // https://github.com/shtylman/node-cookie
https = require('https'),
uuid = require('node-uuid'),

providers = {};

module.exports = new EventEmitter();
exports = module.exports;


/**
 * Storage engine.
 *
 * @type Object
 */
exports.store = null;


/**
 * URL for your authentication endpoint.
 *
 * @type string
 */
exports.authEndpoint = '';


/**
 * Add a provider.
 *
 * @param {string} providerName
 * @param {string} dialogEndpoint OAuth approval dialog URL
 * @param {string} tokenEndpoint Token exchange URL
 * @param {string} appId
 * @param {string} appSecret
 * @param {string} scope
 */
exports.addProvider = function(providerName, dialogEndpoint, tokenEndpoint, appId, appSecret, scope) {
	providers[providerName] = {
		dialogEndpoint: dialogEndpoint,
		tokenEndpoint: tokenEndpoint,
		appId: appId,
		appSecret: appSecret,
		scope: scope
	};
};


/**
 * End a session.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {string} sessionId
 */
exports.logout = function(req, res, sessionId) {
	exports.store.endSession(sessionId, function() {
		exports.emit('logout', req, res, sessionId);
	}, function(err) {
		exports.emit('error', req, res, sessionId, 'logout_fail');
	});
};


/**
 * Redirect a user to the provider's authentication dialog. Note that the user has one day to approve authentication.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {string} providerName
 */
exports.redirectToDialog = function(req, res, providerName) {
	var provider, sessionId, enc = encodeURIComponent;

	provider  = providers[providerName];
	sessionId = uuid.v4({
		rng: uuid.nodeRNG
	});

	exports.store.initSession(providerName, sessionId, 86400, function() {
		res.writeHead(303, 'See Other', {
			Location: provider.dialogEndpoint +
				'?scope=' + enc(provider.scope) +
				'&client_id=' + enc(provider.appId) +
				'&redirect_uri=' + enc(exports.authEndpoint) +
				'&state=' + enc(JSON.stringify({
					provider:   providerName,
					session_id: sessionId
				}))
		});

		res.end();
		exports.emit('dialog', req, res, sessionId);
	}, function() {
		exports.emit('error', req, res, sessionId, 'dialog_redirect_fail');
	});
};


/**
 * Exchange a code for a token with the provider.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} rest
 * @param {Object} state
 * @param {string} code
 */
exports.exchangeCode = function(req, res, state, code) {
	var provider, enc = encodeURIComponent;

	if (!providers.hasOwnProperty(state.provider)) {

		// Unknown provider
		exports.emit('error', req, res, '', 'unknown_provider');
		return;
	}

	provider = providers[state.provider];
	https.get(provider.tokenEndpoint +
		'?client_id=' + enc(provider.appId) +
		'&redirect_uri=' + enc(exports.authEndpoint) +
		'&client_secret=' + enc(provider.appSecret) +
		'&code=' + enc(code),
	function(resToken) {
		var tokenData = '';

		if (resToken.statusCode !== 200) {
			exports.emit('error', req, res, state.session_id, 'token_request_fail');
			return;
		}

		resToken.setEncoding('utf8');
		resToken.on('data', function(chunk) {
			tokenData += chunk;
		});

		resToken.on('end', function() {
			var expiresIn;

			tokenData = querystring.parse(tokenData);
			expiresIn = tokenData.expires || tokenData.expires_in;

			exports.checkSession(state.session_id, function(ttl) {
				if (ttl > 0) {
					exports.store.beginSession(state.session_id, tokenData.access_token, expiresIn, function() {
						exports.emit('begin', req, res, state.session_id, expiresIn);
					}, function(err) {
						exports.emit('error', req, res, state.session_id, 'token_store_fail', err);
					});
				} else {
					exports.emit('error', req, res, state.session_id, 'session_not_found');
				}
			}, function(err) {
				exports.emit('error', req, res, state.session_id, 'session_check_fail', err);
			});
		});
	}).on('error', function(httpErr) {
		exports.emit('error', req, res, state.session_id, 'token_request_fail', httpErr);
	});
};


/**
 * Automatically handle a request made to your auth controller.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} rest
 */
exports.handleAuthRequest = function(req, res) {
	var qs, state;

	qs = querystring.parse(req.url);

	// Step 1: user hits authEndpoint?provider=whatever
	// Redirect the user to the provider's auth dialog
	if (qs.provider && providers.hasOwnProperty(qs.provider)) {
		exports.redirectToDialog(req, res, qs.provider);
		return;
	}

	// Step 2: user is redirected back to auth endpoint
	// Retrieve the state, exchange the returned code for a token and store it
	if (qs.state && qs.code) {
		try {
			state = JSON.parse(qs.state);
		} catch (jsonErr) {
			exports.emit('error', req, res, '', 'state_parse_fail');
			return;
		}

		exports.exchangeCode(req, res, state, qs.code);
		return;
	}

	// Handle explicit errors
	if (qs.error) {
		exports.emit('error', req, res, '', 'provider_error', {
			code: qs.error,

			// Facebook specific:
			message: qs.error_description,
			reason: qs.error_reason
		});

		return;
	}

	// Unknown provider
	exports.emit('error', req, res, '', 'unknown_provider');
};