'use strict';

var Battlefield = require('./lib/Battlefield.js');
var Terrain = require('./lib/Terrain.js');

module.exports = function battle(options) {
  var numAvoiders = options.numAvoiders;
  var numAggressors = options.numAggressors;
  var numWanderers = options.numWanderers;
  var customRobots = options.customRobots;

  function getRandomStartingPosition(canvas) {
    return {
      x: (canvas.width - 100) * Math.random() + 50,
      y: (canvas.height - 100) * Math.random() + 50
    };
  }

  var canvas = document.getElementById('battlefield');

  var terrain = new Terrain({
    width: canvas.width,
    height: canvas.height,
    granularity: 1,
    threshold: 256
  });

  var battlefield = new Battlefield({
    canvas: canvas,
    background: terrain.image,
    passable: terrain.passable,
    showNames: true
  });

  // The sprites are animated using this function.
  function draw(t) {
    battlefield.calculate(t);
    battlefield.render();

    // Next frame.
    window.requestAnimationFrame(draw);
  }

  // Draw before adding robots to ensure everything is initialized for them.
  draw();

  //Custom robots
  customRobots.forEach(function (customRobot) {
    battlefield.makeRobot({
      position: getRandomStartingPosition(canvas),
      name: customRobot.id,
      src: customRobot.id + '/' + customRobot.src,
      body: customRobot.id + '/' + customRobot.body,
      turret: customRobot.id + '/' + customRobot.turret
    });
  });

  // Sampler avoiders.
  for (var i = 0; i < numAvoiders; i++) {
    battlefield.makeRobot({
      position: getRandomStartingPosition(canvas),
      name: 'avoider-' + (i + 1),
      src: 'scripts/brains/avoider.js'
    });
  }

  // Sample aggressors.
  for (var j = 0; j < numAggressors; j++) {
    battlefield.makeRobot({
      position: getRandomStartingPosition(canvas),
      name: 'agressor-' + (j + 1),
      src: 'scripts/brains/aggressor.js'
    });
  }

  // Sample Wanderers.
  for (var k = 0; k < numWanderers; k++) {
    battlefield.makeRobot({
      position: getRandomStartingPosition(canvas),
      name: 'wanderer-' + (k + 1),
      src: 'scripts/brains/wanderer.js'
    });
  }
}
