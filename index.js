'use strict';

var path = require('path');
var express = require('express');
var busboy = require('connect-busboy');
var hoganHelper = require('./lib/hoganHelper');
var uploadRobot = require('./middleware/uploadRobot');
var getRobotIds = require('./middleware/getRobotIds');
var getRobotsData = require('./middleware/getRobotsData');
var getBundle = require('./middleware/getBundle');
var requestLogger = require('./middleware/requestLogger');
var bole = require('bole');
var es = require('event-stream');
var chalk = require('chalk');
var config = require('./lib/config');

bole.output({
  level: config['log-level'],
  stream: es.map(function (data) {
    var logData = JSON.parse(data);
    var colour;

    switch (logData.level) {
    case 'debug':
      colour = chalk.grey;
      break;
    case 'info':
      colour = chalk.green;
      break;
    case 'warn':
      colour = chalk.yellow;
      break;
    case 'error':
      colour = chalk.red;
      break;
    }

    var message = logData.message;

    console.log([
      '[' + logData.time + ']',
      logData.pid,
      colour(logData.level.toUpperCase() + ':'),
      '(' + logData.name + ')',
      colour(typeof message === 'object' ? JSON.stringify(message, null, 2) : message)
    ].join(' '));
  })
});

var log = bole('index');
var app = express();

app.use(express.static('frontend'));
app.use(express.static(path.join(__dirname, 'uploads')));

app.use(requestLogger);
app.use(busboy());

app.set('view engine', 'template');
app.set('views', __dirname +  '/views');
app.engine('template', hoganHelper.render);

hoganHelper.configure(app);

app.get('/', getRobotsData);
app.get('/bundle.js', getBundle);
app.post('/upload-robot', uploadRobot);
app.get('/robot-ids', getRobotIds);
app.get('/upload', function (req, res) {
  res.render('uploads.template');
});

var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

app.listen(port, ip, function () {
  log.info('Listening on port ' + port + '.');
});
