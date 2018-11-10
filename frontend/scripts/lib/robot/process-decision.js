import shoot from '/scripts/lib/robot/shoot.js';
import sendBattleStatus from '/scripts/lib/robot/send-battle-status.js';

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export default function processDecision(robot, battlefield, message) {
  if (!message || message.token !== robot.token) {
    return;
  }

  const acceleration = message.acceleration;

  // Default to previous acceleration.
  if (acceleration) {
    if (hasOwnProperty(acceleration, 'x')) {
      robot.acceleration.x = acceleration.x;
    }

    if (hasOwnProperty(acceleration, 'y')) {
      robot.acceleration.y = acceleration.y;
    }
  }

  if (message.fire) {
    const isArmed = window.performance.now() - robot.lastShot > robot.rearmDuration;

    if (isArmed) {
      shoot(robot, message.fire);
    }
  }

  sendBattleStatus(robot, battlefield.status);
}
