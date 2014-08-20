/* global EventEmitter, inherits */

(function (window, EventEmitter, inherits) {
  'use strict';

  var id = 0;

  function Robot(options) {
    this.lastTime = options.t;

    this.call(EventEmitter);
    this.id = id;
    this.src = options.src;
    this.ctx = options.ctx;
    this.rearmDuration = options.rearmDuration || 2500;

    this.body = new Image();
    this.body.src = options.bodySrc || 'img/robots/body.png';

    this.radar = new Image();
    this.radar.src = options.turretSrc || 'img/robots/turret.png';

    this.worker = new Worker(options.src);
    this.worker.onmessage = (e) => this.decision(e.data);
    this.worker.onerror = (error) => console.error(error);

    id += 1;
  }

  inherits(Robot, EventEmitter);

  Robot.prototype.calculate = function (t, battlefield) {
    var dt = t - this.lastTime;

    this.lastTime = t;
    this.battleStatus = battlefield.status;

    for (let explosion of battlefield.explosions) {
      this.damage(explosion.intensity(this.location) * dt);

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
    this.context.save();

    // Translate the canvas to the middle of the robot.
    this.context.translate(this.position.x, this.position.y);

    // Use the velocity to calculate the orientation of the robot.
    this.context.rotate(Math.atan(this.velocity.y / this.velocity.x));

    // Draw the robot body around the midpoint.
    this.context.drawImage(this.body, -this.body.width / 2, -this.body.height / 2);

    // Rotate the canvas to the additional turret angle.
    this.context.rotate(this.turretAngle);

    // Draw the turret.
    this.context.drawImage(this.turret, -this.turret.width / 2, -this.turret.height / 2);

    // Restore the canvas origin and angle.
    this.context.restore();
  };

  Robot.prototype.shoot = function (angle, range) {
    this.lastShot = window.performance.now();
    this.turretAngle = angle - Math.atan(this.velocity.y / this.velocity.x);
    this.emit('shoot', this.position, angle, range);
  };

  Robot.prototype.decision = function (message) {
    if (message.type !== 'decision') {
      return;
    }

    this.acceleration.x = message.acceleration.x;
    this.acceleration.y = message.acceleration.y;

    if (message.fire && this.isArmed()) {
      var dy = message.fire.target.y - this.position.y;
      var dx = message.fire.target.x - this.position.x;

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
