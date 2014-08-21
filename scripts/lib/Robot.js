/* global EventEmitter, inherits */

(function (window, EventEmitter, inherits) {
  'use strict';

  var id = 0;

  function Robot(options) {
    var robot = this;

    this.lastTime = options.t;

    EventEmitter.call(this);

    this.id = id;
    this.hp = 100;
    this.location = options.location || { x: 200, y: 200 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.src = options.src || 'scripts/brains/default.js';
    this.canvasContext = options.canvasContext;
    this.rearmDuration = options.rearmDuration || 2500;

    this.body = new Image();
    this.body.src = options.bodySrc || 'img/robots/body.png';

    this.turret = new Image();
    this.turret.src = options.turretSrc || 'img/robots/turret.png';
    this.turretAngle = 0;
    this.rearmDuration = 500;
    this.lastShot = window.performance.now();

    this.worker = new Worker(this.src);

    this.worker.onmessage = function (e) {
      robot.decision(e.data);
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
      this.hp -= explosion.intensity(this.location) * dt;

      if (this.hp <= 0) {
        this.emit('destroyed');
        this.removeAllListeners();
        this.worker.terminate();
        this.worker = null;
        return;
      }
    }

    this.velocity.x += this.acceleration.x * dt;
    this.location.x += this.velocity.x * dt;

    this.velocity.y += this.acceleration.y * dt;
    this.location.y += this.velocity.y * dt;
  };

  Robot.prototype.render = function () {
    // Save the initial origin and angle.
    this.canvasContext.save();

    // Translate the canvas to the middle of the robot.
    this.canvasContext.translate(this.location.x, this.location.y);

    // Use the velocity to calculate the orientation of the robot.
    this.canvasContext.rotate(Math.atan(this.velocity.y / this.velocity.x) || 0);

    // Draw the robot body around the midpoint.
    this.canvasContext.drawImage(this.body, -this.body.width / 2, -this.body.height / 2);

    // Rotate the canvas to the additional turret angle.
    this.canvasContext.rotate(this.turretAngle);

    // Draw the turret.
    this.canvasContext.drawImage(this.turret, -this.turret.width / 2, -this.turret.height / 2);

    // Restore the canvas origin and angle.
    this.canvasContext.restore();
  };

  Robot.prototype.shoot = function (angle, range) {
    this.lastShot = window.performance.now();
    this.turretAngle = angle - Math.atan(this.velocity.y / this.velocity.x);
    this.emit('shoot', this.location, angle, range);
  };

  Robot.prototype.decision = function (message) {
    if (message.type !== 'decision') {
      return;
    }

    this.acceleration.x = message.acceleration.x;
    this.acceleration.y = message.acceleration.y;

    if (message.fire && this.isArmed()) {
      this.lastShot = window.performance.now();

      var dy = message.fire.target.y - this.location.y;
      var dx = message.fire.target.x - this.location.x;

      this.shoot(Math.atan(dy / dx), Math.sqrt(dy * dy + dx * dx));
    }

    this.emit('ready');
  };

  Robot.prototype.isArmed = function () {
    return window.performance.now() - this.lastShot > this.rearmDuration;
  };

  Robot.prototype.sendBattleStatus = function (status) {
    this.worker.postMessage({ status: status });
  };

  window.Robot = Robot;
}(window, EventEmitter, inherits));
