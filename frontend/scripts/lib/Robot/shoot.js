import getAngle from '/scripts/lib/get-angle.js';

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export default function shoot(robot, targetPosition) {
  if (!hasOwnProperty(targetPosition, 'x') || !hasOwnProperty(targetPosition, 'y')) {
    return;
  }

  robot.lastShot = window.performance.now();
  robot.turretAngle = getAngle({
    x: targetPosition.x - robot.position.x,
    y: targetPosition.y - robot.position.y
  });

  robot.emit('shoot', robot.position, targetPosition);
}
