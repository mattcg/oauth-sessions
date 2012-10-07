/**
 * OAuth sessions.
 *
 * @fileOverview
 * @author Matthew Caruana Galizia <m@m.cg>
 */

'use strict';

/*jshint node:true */
/*global exports:true*/

var sessions = require('../../index');

module.exports = function(app, cookieOpts) {
	var cookieName;

	cookieName = cookieOpts && cookieOpts.name || '$';

	//app.param('provider', /^\w+$/);
	app.get(sessions.authPath + '/:provider', function(req, res, next) {
		var state, provider = req.params.provider;
	
		if (req.query.code) {
			try {
				state = JSON.parse(req.query.state);
			} catch (e) {
				return next(e);
			}

			if (!state || !state.id) {
				return next();
			}
	
			sessions.create(provider, state.id).exchange(req.query.code, req.protocol + '://' + req.host, function(err, session) {
				if (!err) {
					res.cookie(cookieName, session.id, {
						maxAge:   session.ttl,
						domain:   cookieOpts && cookieOpts.domain || req.host,
						path:     cookieOpts && cookieOpts.path || '/',
						secure:   cookieOpts && cookieOpts.secure || false,
						httpOnly: cookieOpts && cookieOpts.httpOnly || false
					});
				}
	
				next(err);
			});
		} else if (!req.cookies[cookieName]) {
			sessions.create(provider).begin(req.protocol + '://' + req.host, function(err, session, redirect) {
				if (!err) {
					res.redirect(303, redirect);
				}
	
				next(err);
			});
		} else if (req.query.error) {
			next({
				code: req.query.error,
	
				// Facebook specific:
				message: req.query.error_description,
				reason:  req.query.error_reason
			});
		} else {
			next();
		}
	});

	app.get(sessions.authPath + '/:provider/logout', function(req, res, next) {
		if (req.cookies[cookieName]) {
			sessions.create(req.params.provider, req.cookies[cookieName]).end(function(err) {
				next(err);
			});
		} else {
			next();
		}
	});
};