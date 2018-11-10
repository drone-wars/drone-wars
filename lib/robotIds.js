/**
 * This module watches the robots upload path for new directories. Each directory will have the id
 * of a robot as its name, so it's sufficient to scan the uploads directory and collect the names
 * of folders. Whenever the upload directory is modified a list of robots will be update. The
 * module itself is an event emitter that will emit data on the 'update:robotIds' event. The event
 * passes a single argument that looks like:
 *
 *     {
 *         robotIds: < an array of current robotIds >,
 *         added: < an array of added robotIds >,
 *         removed: < an array of removed robotIds >
 *     }
 *
 * The module also exposes the current IDs on exports.robotIds.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const uploadPath = path.join(__dirname, '..', 'uploads');

let watcher;

exports = module.exports = new EventEmitter();
exports.robotIds = [];

// Handle newly read robot IDs.
function setNewWorkerIds(newIds) {
  const oldIds = exports.robotIds;

  exports.robotIds = newIds;

  const added = newIds.filter(id => !oldIds.includes(id));
  const removed = oldIds.filter(id => !newIds.includes(id));

  exports.emit('update:robotIds', { robotIds: newIds, added, removed });
}

async function exportRobotIds() {
  if (watcher) {
    watcher.close();
  }

  const dir = await fs.promises.readdir(uploadPath);
  const directories = (await Promise.all(dir.map(async directory => {
    const stat = await fs.promises.stat(path.join(uploadPath, directory));

    return stat.isDirectory() ? directory : null;
  }))).filter(d => d !== null).sort();

  watcher = fs.watch(uploadPath, { persistent: false }, exportRobotIds);

  setNewWorkerIds(directories);
}

//
exportRobotIds();
