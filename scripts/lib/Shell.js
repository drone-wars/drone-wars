/* global EventEmitter, inherits */

(function (window, EventEmitter, inherits) {
  'use strict';

  function Shell(options) {
    EventEmitter.call(this);

    this.origin = options.location;
    this.location = options.location;
    this.range = options.range;
    this.startTime = options.t;

    this.velocity = {
      x: Math.cos(options.angle) * options.speed,
      y: Math.sin(options.angle) * options.speed
    };
  }

  inherits(Shell, EventEmitter);

  Shell.prototype.calculate = function (t) {
    var dt = t - this.startTime;
    var xMove = dt * this.velocity.x;
    var yMove = dt * this.velocity.y;

    var newPosition = {
      x: this.origin.x + xMove,
      y: this.origin.y + yMove
    };

    this.location = newPosition;

    if (Math.sqrt(xMove * xMove + yMove * yMove) >= this.range) {
      this.emit('explode');
    }
  };

  Shell.prototype.render = function () {

  };

  window.Shell = Shell;
}(window, EventEmitter, inherits));
