/**
 * Store interface.
 *
 * @fileOverview
 * @author Matthew Caruana Galizia <m@m.cg>
 */

'use strict';

/*jshint node:true */
/*global exports:true*/

var store;


/**
 * Get the currently set store, or 'redis' if none.
 *
 * @return {Object}
 */
exports.get = function() {
	if (!store) {
		store = require(__dirname + '/stores/redis');
	}

	return store;
};


/**
 * Set the current store.
 *
 * @param {Object|string} value Strings will be passed to 'require' and the result will be used
 */
exports.set = function(value) {
	if (typeof value === 'string') {
		store = require(value);
	} else {
		store = value;
	}
};