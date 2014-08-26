/* jshint esnext: true */
/* global EventEmitter, inherits, console */

define(['EventEmitter', 'inherits'], function (EventEmitter, inherits) {
  'use strict';

  var id = 0;

  function Robot(options) {
    var battlefield = options.battlefield;
    var robot = this;

    EventEmitter.call(this);

    this.lastTime = options.t;
    this.id = id;
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
      processDecision(robot, e.data);
      sendBattleStatus(robot, battlefield.status);
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

    for (let explosion of battlefield.explosions) {
      this.hp -= explosion.intensity(this.position) * dt;

      if (this.hp <= 0) {
        this.emit('destroyed');
        this.removeAllListeners();
        this.worker.terminate();
        this.worker = null;
        return;
      }
    }

    this.velocity.x += this.acceleration.x * dt;
    this.position.x += this.velocity.x * dt;

    this.velocity.y += this.acceleration.y * dt;
    this.position.y += this.velocity.y * dt;
  };

  Robot.prototype.render = function () {
    // Save the initial origin and angle.
    this.canvasContext.save();

    // Translate the canvas to the middle of the robot.
    this.canvasContext.translate(this.position.x, this.position.y);

    // Use the velocity to calculate the orientation of the robot.
    this.canvasContext.rotate(Math.atan(this.velocity.y / this.velocity.x));

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

    var shellAngle = angle + Math.atan(robot.velocity.y / robot.velocity.x);

    robot.emit('shoot', robot.position, shellAngle, range);
  }

  function processDecision(robot, message) {
    if (message.type !== 'decision') {
      return;
    }

    robot.acceleration.x = message.acceleration.x;
    robot.acceleration.y = message.acceleration.y;

    if (!message.fire) {
      return;
    }

    var isArmed = window.performance.now() - robot.lastShot > robot.rearmDuration;

    if (isArmed) {
      shoot(robot, message.fire.angle, message.fire.range);
    }
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

  return Robot;
});
