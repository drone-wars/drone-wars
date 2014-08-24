/* global EventEmitter, inherits */

define(['EventEmitter', 'inherits'], function (EventEmitter, inherits) {
  'use strict';

  function Shell(options) {
    EventEmitter.call(this);

    this.origin = {
      x: options.position.x,
      y: options.position.y
    };

    this.position = {
      x: options.position.x,
      y: options.position.y
    };

    this.range = options.range;
    this.canvasContext = options.canvasContext;
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

    this.position = {
      x: this.origin.x + xMove,
      y: this.origin.y + yMove
    };

    if (Math.sqrt(xMove * xMove + yMove * yMove) >= this.range) {
      this.emit('explode');
    }
  };

  Shell.prototype.render = function () {
    this.canvasContext.fillStyle = 'black';
    this.canvasContext.beginPath();
    this.canvasContext.arc(this.position.x, this.position.x, 5, 0, 2 * Math.PI);
    this.canvasContext.fill();
  };

  return Shell;
});
