/* jshint worker: true */

(function (self) {
  'use strict';

  var cortex = {};

  cortex.init = function (decider) {

    // Callback function for decider. Sends a decision or error message back to the parent.
    function sendErrorOrMessage(error, message) {
      if (error) {
        return self.postMessage({
          type: 'error',
          data: error
        });
      }

      self.postMessage({
        type: 'decision',
        data: message
      });
    }

    // Process message events from the parent and pass data to the decider.
    function processMessageFromBody(e) {
      if (!e.data) {
        return;
      }

      // Receive and cache a map of passable terrain.
      if (e.data.type === 'passable') {
        cortex.passable = new Uint8ClampedArray(e.data.data);
        return;
      }

      // Process a status update.
      if (e.data.type === 'status') {
        return decider(e.data, sendErrorOrMessage);
      }
    }

    // Listen for incoming messages from the robot body.
    self.addEventListener('message', processMessageFromBody, false);
  };

  // A Queue instance can help to organise actions you may want the body to perform.
  cortex.Queue = function Queue() {
    var queue = this;
    var actions = [];

    // If you forget to use `new`, then Queue will be forgiving and do it for you.
    if (!(queue instanceof Queue)) {
      return new Queue();
    }

    // Add an action to the queue. Actions are executed in the same order that they are added.
    queue.add = function (action) {
      actions.push(action);
    };

    // Remove an action from the queue (if it's still in there). Only removes the first entry of the
    // action.
    queue.remove = function (action) {
      var index = actions.indexOf(action);

      if (index !== -1) {
        actions.splice(index, 1);
      }
    };

    // Pass this method to `cortex.init` in the place of a decider function.
    queue.decider = function (data, callback) {
      var current = actions[0];

      // Nothing left to do.
      if (!current) {
        return;
      }

      current(data, function (error, message, complete) {
        if (complete) {
          queue.remove(current);
        }

        callback(error, message);
      });
    };
  };

  cortex.log = function () {
    self.postMessage({
      type: 'debug',
      data: arguments
    });
  };

  self.cortex = cortex;

}(self));
