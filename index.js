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
Session = require('./lib/session');

exports.authPath = '/oauth/provider';


/**
 * Storage engine interface.
 *
 * @type Object
 */
exports.store = require('./lib/store');


/**
 * Providers list interface.
 *
 * @type string
 */
exports.providers = require('./lib/providers');


/**
 * Create a new Session object.
 *
 * @param {string} provider
 * @param {number} [id]
 * @return {Session}
 */
exports.create = function(provider, id) {
	return new Session(provider, id);
};


/**
 * Automatically set up routing and handling with Express.
 *
 * @param {function} app The Express application instance
 * @param {string} [path] Base path for oauth request routing
 * @param {Object} [cookieOpts]
 */
exports.express = function(app, cookieOpts) {
	return require('./lib/middleware/express')(app, cookieOpts);
};
