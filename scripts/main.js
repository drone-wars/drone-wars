requirejs.config({
  baseUrl: 'scripts/lib',
  paths: {
    EventEmitter: '../../bower_components/eventEmitter/EventEmitter'
  }
});

require(['Battlefield'], function (Battlefield) {
  'use strict';

  var canvas = document.getElementById('canvas');
  var battlefield = new Battlefield(canvas);

  battlefield.makeRobot({ x: 0, y: 0 });
  battlefield.makeRobot({ x: 0, y: 200 });

  // The sprites are animated using this function.
  function draw(t) {
    battlefield.calculate(t);
    battlefield.render();

    // Next frame.
    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);
});
