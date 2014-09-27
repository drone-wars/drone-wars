var getAngle = require('../getAngle');

function shoot(robot, targetPosition) {
  if (!targetPosition.hasOwnProperty('x') || !targetPosition.hasOwnProperty('y')) {
    return;
  }

  robot.lastShot = window.performance.now();
  robot.turretAngle = getAngle({
    x: targetPosition.x - robot.position.x,
    y: targetPosition.y - robot.position.y
  });

  robot.emit('shoot', robot.position, targetPosition);
}

module.exports = shoot;
