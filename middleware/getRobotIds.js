var robotIds = require('../lib/robotIds');

function getRobot(req, res) {
  'use strict';

  res.send(robotIds.robotIds);
}

module.exports = getRobot;
