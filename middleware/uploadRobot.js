var fs = require('fs');
var path = require('path');

function checkRobotFolder(subPath, callback) {
  'use strict';

  fs.stat(subPath, function (err, stats) {
    if (stats && stats.isDirectory()) {
      return callback();
    }

    fs.mkdir(subPath, callback);
  });
}

function handleFile(subPath, fieldname, file) {
  'use strict';

  // Direct the possible files to particular file names.
  switch (fieldname) {
  case 'src':
    return file.pipe(fs.createWriteStream(path.join(subPath, 'src.js')));

  case 'body':
    return file.pipe(fs.createWriteStream(path.join(subPath, 'body.png')));

  case 'turret':
    return file.pipe(fs.createWriteStream(path.join(subPath, 'turret.js')));

  default:
    return file.resume();
  }
}

function uploadRobot(req, res) {
  'use strict';

  var subPath;
  var files = {};
  var gotPath;

  req.busboy.on('field', function (key, value) {
    if (key === 'robot-id') {
      subPath = path.join(__dirname, '..', 'uploads', value);

      checkRobotFolder(subPath, function (err) {
        if (err) {
          return res.status(500).end();
        }

        gotPath = true;

        // Process any stashed files.
        Object.keys(files).forEach(function (fieldname) {
          handleFile(subPath, fieldname, files[fieldname]);
        });
      });
    }
  });

  req.busboy.on('file', function (fieldname, file) {
    if (gotPath) {
      return handleFile(subPath, fieldname, file);
    }

    // If the path isn't sorted yet, stash this.
    files[fieldname] = file;
  });

  req.busboy.on('finish', function () {
    res.status(204).end();
  });

  req.pipe(req.busboy);
}

module.exports = uploadRobot;
