var request = require("request"),
	winston = require("winston"),
	schedule = require("node-schedule"),
	util = require("util"),
	config = require("./config.json"),
	Intervals = require('./lib/interval');

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

/*setInterval(function() {

	winston.info("Current Date: %s", (new Date()).toString());
	winston.info("Next Invocation: %s", j.nextInvocation().toString());

}, 10000);*/

var test = new Error("This is an error");

var interval = null;

config.scheduledTasks.forEach(function(task, index) {

	if (task.interval) {

		if (!interval) {

			interval = new Intervals({

				pulse: 120,
				autoStart: true
			});
		}

		winston.info("Starting %d sec interval job for: %s", task.interval, task.endpoint);

		var result = interval.addJob({

			route: config.baseUrl + task.endpoint, 
			interval: task.interval, 
			callback: function(err, result) {

				if (err) {

					winston.error("Failed task: %s", task.endpoint);
					consoleDump(err);
					consoleDump(result);

				} else {

					winston.info("Completed task: %s", task.endpoint);
					winston.info(result.body);
				}
			}
		});

		if (result.message && result.stack) {
			winston.error(consoleDump(result));
		}

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

var http = require('http');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello, world! [helloworld sample]');
}).listen(process.env.PORT); 