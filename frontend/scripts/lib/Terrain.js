'use strict';

var perlin = require('perlin');

function Terrain(width, height, granularity, threshold) {
  var scales = [
    { freq: 30 * granularity, amp: 4 },
    { freq: 60 * granularity, amp: 8 },
    { freq: 120 * granularity, amp: 16 },
    { freq: 240 * granularity, amp: 32 },
    { freq: 480 * granularity, amp: 64 },
    { freq: 960 * granularity, amp: 128 }
  ];

  var canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  var ctx = canvas.getContext('2d');
  var image = ctx.createImageData(canvas.width, canvas.height);
  var data = image.data;
  var depth = Math.random();

  var passable = new Uint8ClampedArray(width * height);

  function calculateNoiseAtScale(value, scale) {
    var xScale = x / scale.freq;
    var yScale = y / scale.freq;

    return Math.abs(value + perlin.noise.simplex3(xScale, yScale, depth) * scale.amp);
  }

  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var value = scales.reduce(calculateNoiseAtScale, 0);

      var cell = (x + y * width) * 4;

      //data[cell] = 100;
      //data[cell + 1] = value;
      //data[cell + 2] = (255 - value) / 3;

      if (value > 128) {
        data[cell] = 100;
        data[cell + 1] = 100;
        data[cell + 2] = 100;
      } else if (value > 16) {
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

      passable[x + y * width] = value < threshold ? 1 : 0;
    }
  }

  return { image: image, passable: passable };
}

module.exports = Terrain;
