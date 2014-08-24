/* global EventEmitter, inherits */

define(['EventEmitter', 'inherits'], function (EventEmitter, inherits) {
  'use strict';

  function Explosion(options) {
    EventEmitter.call(this);

    this.duration = options.duration;
    this.radius = options.radius;
    this.strength = options.strength;
    this.canvas = options.canvas;
    this.canvasContext = options.canvasContext;
    this.startTime = options.t;
    this.position = options.position;
    this.state = 1;
  }

  inherits(Explosion, EventEmitter);

  Explosion.prototype.intensity = function (position) {
    var dx = this.position.x - position.x;
    var dy = this.position.y - position.y;
    var intensity =  Math.sqrt(dx * dx + dy * dy) < this.radius ? this.strength * this.state : 0;

    return intensity;
  };

  Explosion.prototype.calculate = function (t) {
    this.now = t;
    this.state = (this.duration - (this.now - this.startTime)) / this.duration;

    if (this.state <= 0) {
      this.emit('cleared');
      return;
    }
  };

  Explosion.prototype.render = function () {
    this.canvasContext.fillStyle = 'red';
    this.canvasContext.beginPath();
    this.canvasContext.arc(this.position.x, this.position.x, this.radius, 0, 2 * Math.PI);
    this.canvasContext.fill();
  };

  return Explosion;
});
