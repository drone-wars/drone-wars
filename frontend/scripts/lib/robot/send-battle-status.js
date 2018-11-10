export default function sendBattleStatus(robot, status) {
  robot.token = Math.random()
    .toFixed(5)
    .slice(2, 7);

  const battleData = {
    type: 'status',
    robot: {
      id: robot.id,
      hp: robot.hp,
      position: robot.position,
      velocity: robot.velocity,
      acceleration: robot.acceleration,
      maxAcceleration: robot.maxAcceleration,
      width: robot.body.width,
      height: robot.body.height,
      rearmDuration: robot.rearmDuration,
      timeSinceLastShot: window.performance.now() - robot.lastShot
    },
    status,
    token: robot.token
  };

  robot.worker.postMessage(battleData);
}
