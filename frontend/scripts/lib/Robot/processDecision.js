var shoot = require('./shoot');
var sendBattleStatus = require('./sendBattleStatus');

function processDecision(robot, battlefield, message) {
  if (!message || message.token !== robot.token) {
    return;
  }

  var acceleration = message.acceleration;

  // Default to previous acceleration.
  if (acceleration) {
    if (acceleration.hasOwnProperty('x')) {
      robot.acceleration.x = acceleration.x;
    }

    if (acceleration.hasOwnProperty('y')) {
      robot.acceleration.y = acceleration.y;
    }
  }

  if (message.fire) {
    var isArmed = window.performance.now() - robot.lastShot > robot.rearmDuration;

    if (isArmed) {
      shoot(robot, message.fire);
    }
  }

  sendBattleStatus(robot, battlefield.status);
}

module.exports = processDecision;
