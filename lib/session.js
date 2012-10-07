/**
 * OAuth sessions.
 *
 * @fileOverview
 * @author Matthew Caruana Galizia <m@m.cg>
 */

'use strict';

/*jshint node:true */
/*global exports:true*/

var
providers   = require('./providers'),
store       = require('./store'),
sessions    = require('../index'),
https       = require('https'),
uuid        = require('node-uuid'),
querystring = require('querystring');

module.exports = Session;
function Session(provider, id) {
	if (!provider || !providers.hasOwnProperty(provider)) {
		throw new Error('Unknown/invalid provider');
	}

	this.id       = id;
	this.provider = provider;
	this.token    = null;
	this.ttl      = null;
}


/**
 * Check if a session is still marked alive.
 *
 * @param {function} callback Receives the session TTL and ID as the second and third arguments, error as first
 */ 
Session.prototype.check = function(callback) {
	var that = this, id = this.id;
	store.get().checkSession(this.id, function(err, ttl) {
		if (err || ttl < 1) {
			that.id = null;
		}
		callback(err, that, ttl, id);
	});
};


/**
 * End a session.
 *
 * @param {function} callback Receives the session and ID as the second and third arguments, error as first
 */
Session.prototype.end = function(callback) {
	var that = this, id = this.id;

	if (id) {
		store.get().endSession(id, function(err) {
			that.id = null;
			callback && callback(err, that, id);
		});
	} else {
		throw new Error('No session ID to log out');
	}
};


/**
 * Respond to a request with a redirect to the provider's authentication dialog. Implicitly creates a new ID and assigns it to the session. Note that the user has one day to approve authentication.
 *
 * @param {string} root
 * @param {function} callback Will be called with any error, the session and a redirect URL as arguments
 */
Session.prototype.begin = function(root, callback) {
	var id, provider = this.provider, that = this;

	id = uuid.v4({rng: uuid.nodeRNG});
	store.get().initSession(provider, id, 86400, function(err) {
		var popts, enc, redirect;

		if (!err) {
			that.id  = id;
			popts    = providers[provider];
			enc      = encodeURIComponent;
			redirect = popts.dialogEndpoint +
				'?scope='        + enc(popts.scope) +
				'&client_id='    + enc(popts.appId) +
				'&redirect_uri=' + enc(root + '/' + sessions.authPath + '/' + provider) +
				'&state='        + enc(id);
		}

		// Call the success callback with the session and a redirect URL
		callback && callback(err, that, redirect);
	});
};


/**
 * Exchange a code for a token with the provider.
 *
 * @param {string} code
 * @param {string} root
 * @param {function} callback
 */
Session.prototype.exchange = function(code, root, callback) {
	var popts, enc = encodeURIComponent, that = this, provider = this.provider, id = this.id;

	popts = providers[provider];
	https.get(popts.tokenEndpoint +
		'?client_id='     + enc(popts.appId) +
		'&redirect_uri='  + enc(root + '/' + sessions.authPath + '/' + provider) +
		'&client_secret=' + enc(popts.appSecret) +
		'&code='          + enc(code),
	function(res) {
		var tokenData = '';

		if (res.statusCode !== 200) {
			callback(res, that); // Pass the response as the error object
			return;
		}

		res.setEncoding('ascii');
		res.on('data', function(chunk) {
			tokenData += chunk;
		});

		res.on('end', function() {
			tokenData  = querystring.parse(tokenData);
			that.ttl   = tokenData.expires || tokenData.expires_in;
			that.token = tokenData.access_token;

			store.get().checkSession(id, function(err, ttl) {
				if (!err && ttl > 0) {
					store.get().beginSession(id, that.token, that.ttl, function(err) {
						callback(err, that);
					});
				} else {
					callback(err, that);
				}
			});
		});
	}).on('error', function(err) {
		callback(err, that);
	});
};