var request = require("request"),
	winston = require("winston"),
	schedule = require("node-schedule"),
	util = require("util"),
	config = require("./config.json"),
	Interval = require('./lib/interval');

// Setup Winston Logging
(function() {

	winston.setLevels(winston.config.syslog.levels);

	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, { colorize: true, timestamp: true, level: 'emerg' });

	winston.info('Using console logging...');	
})();

// Create a dump function
function consoleDump(data, depth) {
	console.log(util.inspect(data, {colors: true, depth: depth || 5}));
}

var j = schedule.scheduleJob({minute: [21, 26, 28, 31, 38]}, function() {

	winston.info("Ran a scheduled task!");
});

consoleDump(j);

/*setInterval(function() {

	winston.info("Current Date: %s", (new Date()).toString());
	winston.info("Next Invocation: %s", j.nextInvocation().toString());

}, 10000);*/


config.scheduledTasks.forEach(function(task, index) {

	if (task.interval) {

		winston.info("Starting %d sec interval job for: %s", task.interval, task.endpoint);

		var interval = new Interval({route: config.baseUrl + task.endpoint, interval: task.interval * 1000}, function(err, result) {

			if (err) {

				winston.error("Failed task: %s", task.endpoint);
				consoleDump(err);
				consoleDump(result);

			} else {

				winston.info("Completed task: %s", task.endpoint);
				winston.info(result);
			}
		});

	} else {

		winston.info("Starting a job for '%s' with schedule: Minute: %d, Hour: %d, Day: %s", task.endpoint, task.minute, task.hour, task.day || "everyday");

		var scheduleOpts = {

			minute: typeof task.minute == "undefined" ? null : task.minute,
			hour: typeof task.hour == "undefined" ? null : task.hour,
			dayOfWeek: typeof task.day == "undefined" ? null : task.day
		};

		consoleDump(scheduleOpts);

		var job = schedule.scheduleJob(scheduleOpts, function() {

			request.get(config.baseUrl + task.endpoint, function(err, result, body) {

				if (err || result.statusCode != 200) {

					winston.error("Failed task: %s", task.endpoint);
					consoleDump(err);
					consoleDump({result: result, body: body});

				} else {

					winston.info("Completed task: %s", task.endpoint);
					winston.info(body);
				}
			});
		});

		winston.info("Next Invocation of %s: %s", task.endpoint, job.nextInvocation().toString());
	}
});