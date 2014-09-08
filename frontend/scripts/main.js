require.config({
  baseUrl: 'scripts/lib',
  paths: {
    EventEmitter: '../../bower_components/eventEmitter/EventEmitter',
    Noise: '../../bower_components/noisejs/index'
  }
});

require(['Battlefield', 'Noise'], function (Battlefield, Noise) {
  'use strict';

  var canvas = document.getElementById('battlefield');
  var battlefield = new Battlefield(canvas);
  var noise = new Noise();

  var ctx = canvas.getContext('2d');
  var image = ctx.createImageData(canvas.width, canvas.height);
  var data = image.data;
  var cWidth = canvas.width;
  var cHeight = canvas.height;
  var height = Math.random();

  var passable = new Uint8ClampedArray(cWidth * cHeight);

  for (var x = 0; x < cWidth; x++) {
    for (var y = 0; y < cHeight; y++) {
      var value = Math.abs(noise.perlin3(x / 300, y / 300, height)) * 256;
      var cell = (x + y * cWidth) * 4;

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
        data[cell + 2] = 192;
      }

      // Opacity.
      data[cell + 3] = 255;

      passable[x + y * cWidth] = value < 128 ? 1 : 0;
    }
  }

  battlefield.background = image;
  battlefield.passable = passable;

  // The sprites are animated using this function.
  function draw(t) {
    battlefield.calculate(t);
    battlefield.render();

    // Next frame.
    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);

  // Test robots. Use setTimeout to make sure the battlefield is initialized before robots enter.
  setTimeout(function () {

    // Sampler avoiders.
    for (var i = 0; i < 3; i++) {
      battlefield.makeRobot({
        x: (canvas.width - 100) * Math.random() + 50,
        y: (canvas.height - 100) * Math.random() + 50
      }, 'scripts/brains/avoider.js');
    }

    // Sample aggressors.
    for (var i = 0; i < 3; i++) {
      battlefield.makeRobot({
        x: (canvas.width - 100) * Math.random() + 50,
        y: (canvas.height - 100) * Math.random() + 50,
      }, 'scripts/brains/aggressor.js');
    }

  }, 10);
});
