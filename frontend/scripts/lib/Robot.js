define([
  'EventEmitter',
  'inherits',
  'getAngleFromVelocity'
], function (
  EventEmitter,
  inherits,
  getAngleFromVelocity
) {
  'use strict';

  var id = 0;

  function Robot(options) {
    var battlefield = options.battlefield;
    var robot = this;

    EventEmitter.call(robot);

    robot.lastTime = options.t;
    robot.id = id.toString();
    robot.hp = 100;
    robot.position = options.position || { x: 200, y: 200 };
    robot.velocity = { x: 0, y: 0 };
    robot.acceleration = { x: 0, y: 0 };
    robot.src = options.src || 'scripts/brains/default.js';
    robot.canvasContext = options.canvasContext;
    robot.rearmDuration = options.rearmDuration || 500;

    robot.body = new Image();
    robot.body.src = options.bodySrc || 'img/robots/body.png';

    robot.turret = new Image();
    robot.turret.src = options.turretSrc || 'img/robots/turret.png';
    robot.turretAngle = 0;
    robot.lastShot = window.performance.now();

    robot.worker = new Worker(robot.src);

    robot.worker.onmessage = function (e) {
      handleMessage(robot, battlefield, e.data);
    };

    robot.worker.onerror = function (error) {
      console.error(error);
    };

    robot.worker.postMessage('');

    id += 1;
  }

  inherits(Robot, EventEmitter);

  Robot.prototype.calculate = function (t, battlefield) {
    var robot = this;
    var dt = t - robot.lastTime;

    robot.lastTime = t;
    robot.battleStatus = battlefield.status;

    for (var explosion of battlefield.explosions) {
      robot.hp -= explosion.intensity(robot.position) * dt;

      if (robot.hp <= 0) {
        robot.emit('destroyed');
        robot.removeAllListeners();
        robot.worker.terminate();
        //robot.worker = null;
        return;
      }
    }

    robot.velocity.x += robot.acceleration.x * dt;
    robot.position.x += robot.velocity.x * dt;

    robot.velocity.y += robot.acceleration.y * dt;
    robot.position.y += robot.velocity.y * dt;

    robot.angle = getAngleFromVelocity(robot.velocity);
  };

  Robot.prototype.render = function () {
    var robot = this;

    // Save the initial origin and angle.
    robot.canvasContext.save();

    // Translate the canvas to the middle of the robot.
    robot.canvasContext.translate(robot.position.x, robot.position.y);

    // Use the velocity to calculate the orientation of the robot.
    robot.canvasContext.rotate(robot.angle);

    // Draw the robot body around the midpoint.
    robot.canvasContext.drawImage(robot.body, -robot.body.width / 2, -robot.body.height / 2);

    // Rotate the canvas to the additional turret angle.
    robot.canvasContext.rotate(robot.turretAngle);

    // Draw the turret.
    robot.canvasContext.drawImage(robot.turret, -robot.turret.width / 2, -robot.turret.height / 2);

    // Restore the canvas origin and angle.
    robot.canvasContext.restore();

    // Draw health bar
    robot.canvasContext.strokeStyle = 'black';
    robot.canvasContext.strokeRect(robot.position.x - 25, robot.position.y - 40, 50, 10) ;
    robot.canvasContext.fillStyle = 'green';
    robot.canvasContext.fillRect(robot.position.x - 25, robot.position.y - 40, robot.hp / 2, 10);
    robot.canvasContext.fillStyle = 'red';
    robot.canvasContext.fillRect((robot.position.x - 25 + robot.hp / 2), robot.position.y - 40, (50 - robot.hp / 2), 10);

    robot.canvasContext.restore();
  };

  function shoot(robot, angle, range) {
    robot.lastShot = window.performance.now();
    robot.turretAngle = angle;

    robot.emit('shoot', robot.position, robot.turretAngle + robot.angle, range);
  }

  function processDecision(robot, battlefield, message) {
    if (message.type !== 'decision') {
      return;
    }

    robot.acceleration.x = message.acceleration.x;
    robot.acceleration.y = message.acceleration.y;

    if (message.fire) {
      var isArmed = window.performance.now() - robot.lastShot > robot.rearmDuration;

      if (isArmed) {
        shoot(robot, message.fire.angle, message.fire.range);
      }
    }

    sendBattleStatus(robot, battlefield.status);
  }

  function sendBattleStatus(robot, status) {
    var battleData = {
      type: 'status',
      robot: {
        id: robot.id,
        hp: robot.hp,
        position: robot.position,
        velocity: robot.velocity,
        acceleration: robot.acceleration,
        rearmDuration: robot.rearmDuration,
        timeSinceLastShot: window.performance.now() - robot.lastShot
      },
      status: status
    };

    robot.worker.postMessage(battleData);
  }

  function handleMessage(robot, battlefield, message) {
    switch (message.type) {
    case 'decision':
      return processDecision(robot, battlefield, message);

    case 'debug':
      return console.log(message.data);

    default:
      return console.log('Message from robot worker ', robot.id + ':', message);
    }
  }

  return Robot;
});
