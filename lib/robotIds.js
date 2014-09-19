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

var fs = require('fs');
var path = require('path');
var async = require('async');
var diff = require('lodash.difference');
var EventEmitter = require('events').EventEmitter;
var config = require('./config');

var uploadPath = path.join(__dirname, '..', config['upload-path']);
var watcher;

exports = module.exports = new EventEmitter();
exports.robotIds = [];

// Handle newly read robot IDs.
function setNewWorkerIds(newIds) {
  var oldIds = exports.robotIds;

  exports.robotIds = newIds;

  exports.emit('update:robotIds', {
    robotIds: newIds,
    added: diff(newIds, oldIds),
    removed: diff(oldIds, newIds)
  });
}

// Read the upload directory.
function readdir(callback) {
  fs.readdir(uploadPath, callback);
}

// Filter members of the upload directory to IDs.
function processMembers(callback, results) {
  async.reduce(results.members, [], function (ids, member, callback) {
    var robotPath = path.join(uploadPath, member);

    fs.stat(robotPath, function (err, stat) {
      if (err) {
        return callback(err);
      }

      if (stat.isDirectory()) {
        ids.push(member);
      }

      callback(null, ids);
    });
  }, callback);
}

function exportRobotIds() {
  if (watcher) {
    watcher.close();
  }

  async.auto({
    members: readdir,
    ids: ['members', processMembers]
  }, function (err, results) {
    if (err) {
      // Nothing we can do. Throw and bring down this process.
      throw err;
    }

    var ids = results.ids;

    watcher = fs.watch(uploadPath, { persistent: false }, exportRobotIds);
    ids.sort();
    setNewWorkerIds(ids);
  });
}

//
exportRobotIds();
