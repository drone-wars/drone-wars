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
      if (!e.data || e.data.type !== 'status') {
        return;
      }

      decider(e.data, sendErrorOrMessage);
    }

    self.addEventListener('message', processMessageFromBody, false);
  };

  self.cortex = cortex;

}(self));
