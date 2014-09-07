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

  // Test robots.
  setTimeout(function () {
    for (var i = 0; i < 10; i++) {
      battlefield.makeRobot({
        x: canvas.width * Math.random(),
        y: canvas.height * Math.random()
      });
    }
  }, 0);
});
