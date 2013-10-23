var request = require("request");

module.exports = (function() {

	var defaultIntervalInSecs = 30,
		defaultRoute = null,
		intervalObj = null;

	return function(opts, cb) {

		if (typeof opts == "undefined" || typeof opts == "function") {

			cb = (typeof opts == "function") ? opts : function(err) {};

			opts = {
				route: null,
				interval: defaultIntervalInSecs
			};
		}

		var route = opts.route,
			interval = opts.interval;

		if (route && interval) {

			intervalObj = setInterval(function() {

				request.get(route, function(err, result, body) {

					if (err || result.statusCode != 200) {

						cb(err, {result: result, body: body});
						return;

					} else {

						cb(null, body);
						return;
					}
				});

			}, interval);
		}
	};

})();