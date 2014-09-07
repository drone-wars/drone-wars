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

  var MAX_HEALTH = 100;
  var HEALTH_BAR_WIDTH = MAX_HEALTH / 2;
  var HEALTH_BAR_X_OFFSET = 25;
  var HEALTH_BAR_Y_OFFSET = 40;
  var HEALTH_BAR_HEIGHT = 10;

  function drawHealthBar(robot){
    var healthLeftWidth = robot.hp / 2;
    var xPos = robot.position.x - HEALTH_BAR_X_OFFSET;
    var yPos = robot.position.y - HEALTH_BAR_Y_OFFSET;

    robot.canvasContext.strokeStyle = 'black';
    robot.canvasContext.strokeRect(xPos, yPos, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

    robot.canvasContext.fillStyle = 'green';
    robot.canvasContext.fillRect(xPos, yPos, healthLeftWidth, HEALTH_BAR_HEIGHT);

    robot.canvasContext.fillStyle = 'red';
    robot.canvasContext.fillRect(
      xPos + healthLeftWidth, yPos,
      HEALTH_BAR_WIDTH - healthLeftWidth,
      HEALTH_BAR_HEIGHT
    );
  }

  function Robot(options) {
    var battlefield = options.battlefield;
    var robot = this;

    EventEmitter.call(robot);

    robot.lastTime = options.t;
    robot.id = id.toString();
    robot.hp = MAX_HEALTH;
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

    robot.token = null;

    sendBattleStatus(robot, battlefield.status);

    id += 1;
  }

  inherits(Robot, EventEmitter);

  Robot.prototype.calculate = function (t, battlefield) {
    var robot = this;
    var dt = t - robot.lastTime;

    robot.lastTime = t;
    robot.battleStatus = battlefield.status;

    for (var i = battlefield.explosions.length - 1; i >= 0; i--) {
      robot.hp -= battlefield.explosions[i].intensity(robot.position) * dt;

      if (robot.hp <= 0) {
        robot.emit('destroyed');
        robot.removeAllListeners();
        robot.worker.terminate();
        robot.worker = null;

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

    drawHealthBar(robot);
  };

  function shoot(robot, angle, range) {
    robot.lastShot = window.performance.now();
    robot.turretAngle = angle;

    robot.emit('shoot', robot.position, robot.turretAngle + robot.angle, range);
  }

  function processDecision(robot, battlefield, message) {
    if (message.token !== robot.token) {
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
    robot.token = Math.random().toFixed(5).slice(2,7);

    var battleData = {
      type: 'status',
      robot: {
        id: robot.id,
        hp: robot.hp,
        position: robot.position,
        velocity: robot.velocity,
        acceleration: robot.acceleration,
        width: robot.body.width,
        height: robot.body.height,
        rearmDuration: robot.rearmDuration,
        timeSinceLastShot: window.performance.now() - robot.lastShot
      },
      status: status,
      token: robot.token
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
