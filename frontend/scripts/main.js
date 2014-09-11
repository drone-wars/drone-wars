'use strict';

require.config({
  baseUrl: 'scripts/lib',
  paths: {
    EventEmitter: '../../bower_components/eventEmitter/EventEmitter',
    Noise: '../../bower_components/noisejs/index'
  }
});

function getRandomStartingPosition(canvas){
  return {
    x: (canvas.width - 100) * Math.random() + 50,
    y: (canvas.height - 100) * Math.random() + 50
  };
}

require(['Battlefield', 'Terrain'], function (Battlefield, Terrain) {
  var canvas = document.getElementById('battlefield');
  var terrain = new Terrain(canvas.width, canvas.height, 1, 256);

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

    // Custom robots
    customRobots.forEach(function(customRobot){
      battlefield.makeRobot({
        position: getRandomStartingPosition(canvas),
        name: customRobot.id,
        src: customRobot.id + '/' + customRobot.src,
        body: customRobot.id + '/' + customRobot.body,
        turret: customRobot.id + '/' + customRobot.turret
      });
    });

    // Sampler avoiders.
    for (i = 0; i < 3; i++) {
      battlefield.makeRobot({
        position: getRandomStartingPosition(canvas),
        name: 'avoider-' + (i + 1),
        src: 'scripts/brains/avoider.js'
      });
    }

    // Sample aggressors.
    for (i = 0; i < 3; i++) {
      battlefield.makeRobot({
        position: getRandomStartingPosition(canvas),
        name: 'agressor-' + (i + 1),
        src: 'scripts/brains/aggressor.js'
      });
    }

    battlefield.makeRobot({
      x: (canvas.width - 100) * Math.random() + 50,
      y: (canvas.height - 100) * Math.random() + 50,
    }, 'scripts/brains/wanderer.js');
  }, 10);
});
