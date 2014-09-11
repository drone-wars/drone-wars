define(['Noise'], function (Noise) {
  'use strict';

  function Terrain(width, height, granularity, threshold) {
    var noise = new Noise();
    var canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext('2d');
    var image = ctx.createImageData(canvas.width, canvas.height);
    var data = image.data;
    var depth = Math.random();

    var passable = new Uint8ClampedArray(width * height);

    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        var value = Math.abs(noise.perlin3(x / 300, y / 300, depth)) * 256;
        var cell = (x + y * width) * 4;

        if (value > 128) {
          data[cell] = 100;
          data[cell + 1] = 100;
          data[cell + 2] = 100;
        } else if (value > 64) {
          data[cell] = 140;
          data[cell + 1] = 143;
          data[cell + 2] = 37;
        } else if (value > 16) {
          data[cell] = 52;
          data[cell + 1] = 122;
          data[cell + 2] = 48;
        } else {
          data[cell] = 34;
          data[cell + 1] = 56;
          data[cell + 2] = 162;
        }

        // Opacity.
        data[cell + 3] = 255;

        passable[x + y * width] = value < threshold ? 1 : 0;
      }
    }

    return { image: image, passable: passable };
  }

  return Terrain;
});
