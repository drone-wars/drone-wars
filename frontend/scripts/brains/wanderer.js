/* jshint worker: true, latedef: false */
/* global Neocortex */

/**
 * Wanderer uses the Neocortex To manage a queue system for you, and predefines some actions to use.
 */

// Import cortex for helpers.
importScripts('/scripts/brains/neocortex.js');

// Wrapping neocortex creating in a function allows it to be called recursively, so the robot
// performs these actions in a loop.
function addActions() {
  var neocortex = new Neocortex();

  neocortex.addMove('moveTo', { x: 100, y: 100 });
  neocortex.addMove('fireAtClosestEnemy');
  neocortex.addMove('moveTo', { x: 500, y: 100 });
  neocortex.addMove('fireAtClosestEnemy');
  neocortex.addMove('moveTo', { x: 500, y: 500 });
  neocortex.addMove('fireAtClosestEnemy');
  neocortex.addMove('moveTo', { x: 100, y: 500 });
  neocortex.addMove('fireAtClosestEnemy');

  neocortex.start(addActions);
}

// The callback to start is a function you want to run when the queue has been exhausted
addActions();
