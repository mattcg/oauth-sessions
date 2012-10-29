/**
 * @author Matthew Caruana Galizia <m@m.cg>
 * @copyright Copyright (c) 2012, Matthew Caruana Galizia
 * @package oauth-sessions
 */

'use strict';

/*jshint node:true */

function expressOAauthSessions(options, oauthSessions) {
	var cookieName, logoutPath, cookieDomain, cookiePath, cookieSecure, cookieHttp, sessionNegotiator, sessionManager;

	sessionNegotiator = oauthSessions.sessionNegotiator;
	sessionManager    = oauthSessions.sessionManager;

	logoutPath = options && options.logoutPath || '/logout';

	// Cookie-specific options
	cookieName   = options && options.cookieName || '$';
	cookieDomain = options && options.cookieDomain;
	cookiePath   = options && options.cookiePath || '/';
	cookieSecure = options && options.cookieSecure || false,
	cookieHttp   = options && options.cookieHttp || false;

	return function(req, res, next) {
		var id;

		// Logout of the session
		if (req.path.indexOf(logoutPath) === 0) {
			if (!req.cookies[cookieName]) {
				return next('Nothing to logout of');
			}

			return sessionManager.kill(req.cookies[cookieName], function(err) {
				next(err);
			});
		}

		// Exchange a code for a token
		if (req.query.code) {
			id = req.query.state;
			if (!id) {
				return next('Unable to recover session ID from state parameter');
			}
	
			return sessionManager.retrieve(id, function(err, session) {
				if (err) {
					return next(err);
				}

				sessionNegotiator.exchangeToken(session, req.query.code, function(err) {
					if (err) {
						return next(err);
					}

					res.cookie(cookieName, session.id, {
						maxAge:   session.ttl,
						domain:   cookieDomain || req.host,
						path:     cookiePath,
						secure:   cookieSecure,
						httpOnly: cookieHttp
					});

					next();
				});
			});
		}

		if (!req.cookies[cookieName]) {
			return sessionManager.create(req.query.provider, function(err, session) {
				if (err) {
					return next(err);
				}

				res.redirect(303, sessionNegotiator.getDialogUri(session));
				next();
			});
		}

		if (req.query.error) {
			return next({
				code: req.query.error,
	
				// Facebook specific:
				message: req.query.error_description,
				reason:  req.query.error_reason
			});
		}

		next();
	};
}

module.exports = expressOAauthSessions;