/* global EventEmitter, inherits */

(function (window, EventEmitter, inherits) {
  'use strict';

  function Explosion(options) {
    EventEmitter.call(this);

    this.duration = options.duration;
    this.radius = options.radius;
    this.strength = options.strength;
    this.canvas = options.canvas;
    this.canvasContext = options.canvasContext;
    this.startTime = options.t;
    this.location = options.location;
  }

  inherits(Explosion, EventEmitter);

  Explosion.prototype.intensity = function (location) {
    var dx = this.location.x - location.x;
    var dy = this.location.y - location.y;

    return Math.sqrt(dx * dx + dy * dy) < this.radius ? this.strengh * this.state : 0;
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

  window.Explosion = Explosion;
}(window, EventEmitter, inherits));
