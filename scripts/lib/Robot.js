/* jshint esnext: true */
/* global EventEmitter, inherits, console */

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

    EventEmitter.call(this);

    this.lastTime = options.t;
    this.id = id.toString();
    this.hp = 100;
    this.position = options.position || { x: 200, y: 200 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.src = options.src || 'scripts/brains/default.js';
    this.canvasContext = options.canvasContext;
    this.rearmDuration = options.rearmDuration || 500;

    this.body = new Image();
    this.body.src = options.bodySrc || 'img/robots/body.png';

    this.turret = new Image();
    this.turret.src = options.turretSrc || 'img/robots/turret.png';
    this.turretAngle = 0;
    this.lastShot = window.performance.now();

    this.worker = new Worker(this.src);

    this.worker.onmessage = function (e) {
      handleMessage(robot, battlefield, e.data);
    };

    this.worker.onerror = function (error) {
      console.error(error);
    };

    this.worker.postMessage('');

    id += 1;
  }

  inherits(Robot, EventEmitter);

  Robot.prototype.calculate = function (t, battlefield) {
    var dt = t - this.lastTime;

    this.lastTime = t;
    this.battleStatus = battlefield.status;

    for (var explosion of battlefield.explosions) {
      this.hp -= explosion.intensity(this.position) * dt;

      if (this.hp <= 0) {
        this.emit('destroyed');
        this.removeAllListeners();
        this.worker.terminate();
        //this.worker = null;
        return;
      }
    }

    this.velocity.x += this.acceleration.x * dt;
    this.position.x += this.velocity.x * dt;

    this.velocity.y += this.acceleration.y * dt;
    this.position.y += this.velocity.y * dt;

    this.angle = getAngleFromVelocity(this.velocity);
  };

  Robot.prototype.render = function () {
    // Save the initial origin and angle.
    this.canvasContext.save();

    // Translate the canvas to the middle of the robot.
    this.canvasContext.translate(this.position.x, this.position.y);

    // Use the velocity to calculate the orientation of the robot.
    this.canvasContext.rotate(this.angle);

    // Draw the robot body around the midpoint.
    this.canvasContext.drawImage(this.body, -this.body.width / 2, -this.body.height / 2);

    // Rotate the canvas to the additional turret angle.
    this.canvasContext.rotate(this.turretAngle);

    // Draw the turret.
    this.canvasContext.drawImage(this.turret, -this.turret.width / 2, -this.turret.height / 2);

    // Restore the canvas origin and angle.
    this.canvasContext.restore();
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
