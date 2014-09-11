require.config({
  baseUrl: 'scripts/lib',
  paths: {
    EventEmitter: '../../bower_components/eventEmitter/EventEmitter',
    Noise: '../../bower_components/noisejs/index'
  }
});

require(['Battlefield', 'Terrain'], function (Battlefield, Terrain) {
  'use strict';

  var canvas = document.getElementById('battlefield');
  var terrain = new Terrain(canvas.width, canvas.height, 300, 256);

  var battlefield = new Battlefield({
    canvas: canvas,
    background: terrain.image,
    passable: terrain.passable
  });

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
    var i;

    // Sampler avoiders.
    for (i = 0; i < 3; i++) {
      battlefield.makeRobot({
        x: (canvas.width - 100) * Math.random() + 50,
        y: (canvas.height - 100) * Math.random() + 50
      }, 'scripts/brains/avoider.js');
    }

    // Sample aggressors.
    for (i = 0; i < 3; i++) {
      battlefield.makeRobot({
        x: (canvas.width - 100) * Math.random() + 50,
        y: (canvas.height - 100) * Math.random() + 50,
      }, 'scripts/brains/aggressor.js');
    }

  }, 10);
});
