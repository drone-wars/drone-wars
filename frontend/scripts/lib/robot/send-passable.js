export default function sendPassable(robot, passable) {
  const copy = passable.buffer.slice(0);

  robot.worker.postMessage({ type: 'passable', data: copy }, [copy]);
}
