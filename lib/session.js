/**
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

'use strict';

/*jshint node:true */

function Session(provider, id) {
	if (!provider) {
		throw new TypeError('Provider is required');
	}

	this.id       = id;
	this.provider = provider;
	this.token    = null;
	this.ttl      = null;
}

module.exports = Session;