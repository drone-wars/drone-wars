/* globals importScripts, cortex */
importScripts('/scripts/brains/cortex.js');

function decider (data, done) {
  var message = {
    acceleration: { x: 0, y: 0 },
    token: data.token
  };

  /////////////////////////////////////////////////////


  done(message);
}

cortex.init(decider);
