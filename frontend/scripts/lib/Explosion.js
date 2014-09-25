'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

function Explosion(options) {
  EventEmitter.call(this);

  this.duration = options.duration;
  this.radius = options.radius;
  this.strength = options.strength;
  this.canvasContext = options.canvasContext;
  this.startTime = options.t;
  this.position = {
    x: options.position.x,
    y: options.position.y
  };
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
  var alpha = 1 - (this.now - this.startTime) / this.duration;

  this.canvasContext.fillStyle = 'rgba(255, 75, 0, ' + alpha + ')';
  this.canvasContext.beginPath();
  this.canvasContext.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
  this.canvasContext.fill();
};

Explosion.prototype.getPublicData = function () {
  return {
    position: {
      x: this.position.x,
      y: this.position.y
    },
    radius: this.radius,
    strength: this.strength
  };
}

module.exports = Explosion;
