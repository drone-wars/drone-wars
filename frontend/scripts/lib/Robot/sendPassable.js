function sendPassable(robot, passable) {
  var copy = passable.buffer.slice(0);

  robot.worker.postMessage({ type: 'passable', data: copy }, [copy]);
}

module.exports = sendPassable;
