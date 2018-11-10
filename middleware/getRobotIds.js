'use strict';

const robotIds = require('../lib/robotIds');

function getRobot(req, res) {
  res.send(robotIds.robotIds);
}

module.exports = getRobot;
