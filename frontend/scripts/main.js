require.config({
  baseUrl: 'scripts/lib',
  paths: {
    EventEmitter: '../../bower_components/eventEmitter/EventEmitter'
  }
});

require(['Battlefield'], function (Battlefield) {
  'use strict';

  var canvas = document.getElementById('battlefield');
  var battlefield = new Battlefield(canvas);

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
