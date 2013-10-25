var request = require("request");

module.exports = (function() {

	var defaultPulse = 60;

	return function(opts) {

		var jobs = [],
			options = {},
			intervalTimer = null,
			tickCount = 0;

		if (typeof opts == "undefined" || typeof opts == "function") {
			opts = {
				pulse: defaultPulse
			};
		}

		options = opts;

		var timerHandler = function() {

			if (jobs.length < 1) {
				return;
			}

			tickCount++;

			// console.log("Current Tick Count: " + tickCount);

			jobs.forEach(function(job, index) {

				if (tickCount % job.ticks != 0) {
					return;
				}

				// console.log("Running job: " + job.route + ", on tick count: " + tickCount);

				request.get(job.route, function(err, result, body) {

					if (err || result.statusCode != 200) {
						job.callback(err, {job: job, result: result, body: body});
					} else {
						job.callback(null, {job: job, body: body});
					}

					return;
				});
			});
		};

		this.addJob = function(jobOpts) {

			if (typeof jobOpts.route == "undefined" || typeof jobOpts.route != "string") {
				return (new Error("Endpoint route not defined or invalid type"));
			}

			if (typeof jobOpts.interval == "undefined" || typeof jobOpts.interval != "number") {
				return (new Error("Job interval not defined or invalid"));
			}

			if (typeof jobOpts.callback == "undefined") {
				jobOpts.callback = function(err, result) {};
			}

			if (jobOpts.interval < options.pulse) {
				return (new Error("The Job interval defined is less than the global scheduler pulse interval"));
			}

			jobs.push({

				id: Math.round(Math.random() * 1000000),
				route: jobOpts.route,
				interval: jobOpts.interval,
				ticks: Math.round(jobOpts.interval / options.pulse),
				callback: jobOpts.callback
			});

			// console.log("Scheduling '" + jobOpts.route + "' after ticks: " + Math.round(jobOpts.interval / options.pulse));
			// console.log("Current Job Count: " + jobs.length);

			return this;
		}

		this.start = function() {

			intervalTimer = setInterval(timerHandler, options.pulse * 1000);
			return this;
		}

		this.stop = function() {

			clearInterval(intervalTimer);
			return this;
		}

		if (options.autoStart) {
			this.start();
		}
	};

})();