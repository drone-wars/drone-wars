import Battlefield from './lib/battlefield.js';
import Terrain from './lib/terrain.js';

export default function battle(options) {
  const numAvoiders = options.numAvoiders;
  const numAggressors = options.numAggressors;
  const numWanderers = options.numWanderers;
  const customRobots = options.customRobots;

  function getRandomStartingPosition(canvas) {
    return {
      x: (canvas.width - 100) * Math.random() + 50,
      y: (canvas.height - 100) * Math.random() + 50
    };
  }

  const canvas = document.getElementById('battlefield');

  const terrain = new Terrain({
    width: canvas.width,
    height: canvas.height,
    granularity: 1,
    threshold: 256
  });

  const battlefield = new Battlefield({
    canvas,
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
  for (const robot of customRobots) {
    battlefield.makeRobot({
      position: getRandomStartingPosition(canvas),
      name: robot.id,
      src: `${robot.id}/${robot.src}`,
      body: `${robot.id}/${robot.body}`,
      turret: `${robot.id}/${robot.turret}`
    });
  }

  // Sampler avoiders.
  for (let i = 0; i < numAvoiders; i++) {
    battlefield.makeRobot({
      position: getRandomStartingPosition(canvas),
      name: `avoider-${i + 1}`,
      src: 'scripts/brains/avoider.js'
    });
  }

  // Sample aggressors.
  for (let j = 0; j < numAggressors; j++) {
    battlefield.makeRobot({
      position: getRandomStartingPosition(canvas),
      name: `agressor-${j + 1}`,
      src: 'scripts/brains/aggressor.js'
    });
  }

  // Sample Wanderers.
  for (let k = 0; k < numWanderers; k++) {
    battlefield.makeRobot({
      position: getRandomStartingPosition(canvas),
      name: `wanderer-${k + 1}`,
      src: 'scripts/brains/wanderer.js'
    });
  }
}
