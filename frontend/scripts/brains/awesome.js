importScripts('/scripts/brains/cortex.js');

var queue = new cortex.Queue();

cortex.init(queue.decider);
