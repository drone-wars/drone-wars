'use strict';

var perlin = require('perlin');

function Terrain(options) {
  var width = options.width;
  var height = options.height;
  var granularity = options.granularity;
  var threshold = options.threshold;
  var canvas = document.createElement('canvas');
  var x, y, cell, value;

  var scales = [
    { freq: 30 * granularity, amp: 4 },
    { freq: 60 * granularity, amp: 8 },
    { freq: 120 * granularity, amp: 16 },
    { freq: 240 * granularity, amp: 32 },
    { freq: 480 * granularity, amp: 64 },
    { freq: 960 * granularity, amp: 128 }
  ];

  canvas.width = width;
  canvas.height = height;

  this.image = canvas.getContext('2d').createImageData(width, height);

  var data = this.image.data;
  var depth = Math.random();

  this.passable = new Uint8ClampedArray(width * height);

  function calculateNoiseAtScale(value, scale) {
    return value + perlin.noise.simplex3(x / scale.freq, y / scale.freq, depth) * scale.amp;
  }

  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      value = Math.abs(scales.reduce(calculateNoiseAtScale, 0));
      cell = (x + y * width) * 4;

      if (value > 128) {
        data[cell] = 100;
        data[cell + 1] = 100;
        data[cell + 2] = 100;
      } else if (value > 8) {
        data[cell] = 52 / 32 * value;
        data[cell + 1] = 122 / 32 * value;
        data[cell + 2] = 48 / 32 * value;
      } else {
        data[cell] = 34 / 16 * value;
        data[cell + 1] = 56 / 16 * value;
        data[cell + 2] = 162 / 16 * value;
      }

      // Opacity.
      data[cell + 3] = 255;

      this.passable[x + y * width] = value < threshold ? 1 : 0;
    }
  }
}

module.exports = Terrain;
