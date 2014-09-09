var fs = require('fs');
var path = require('path');
var string = require('string');

function checkRobotFolder(subPath, callback) {
  'use strict';

  fs.stat(subPath, function (err, stats) {
    if (stats && stats.isDirectory()) {
      return callback(null, true);
    }

    fs.mkdir(subPath, function(err){
      callback(err, false);
    });
  });
}

function handleFile(subPath, name, file, originalFilename) {
  'use strict';

  var extension = path.extname(originalFilename);

  // Direct the possible files to particular file names.
  switch (name) {
  case 'src':
    return file.pipe(fs.createWriteStream(path.join(subPath, 'src.js')));

  case 'body':
    return file.pipe(fs.createWriteStream(path.join(subPath, 'body' + extension)));

  case 'turret':
    return file.pipe(fs.createWriteStream(path.join(subPath, 'turret' + extension)));

  default:
    return file.resume();
  }
}

function uploadRobot(req, res) {
  'use strict';

  var robotId;
  var subPath;
  var pendingFiles = [];
  var gotPath;
  var isNew = true;

  req.busboy.on('field', function (key, value) {
    if (key === 'robot-id') {
      robotId = string(value).slugify().s;
      subPath = path.join(__dirname, '..', 'uploads', robotId);

      checkRobotFolder(subPath, function (err, overwritten) {
        if (err) {
          console.error(err);
          return res.status(500).end();
        }

        if(overwritten){
          isNew = false;
        }

        gotPath = true;

        // Process any stashed files.
        pendingFiles.forEach(function (pendingFile) {
          handleFile(subPath, pendingFile.name, pendingFile.file, pendingFile.originalFilename);
        });
      });
    }
  });

  req.busboy.on('file', function (fieldname, file, filename) {
    // Return early if no file specified
    if(!filename){
      return file.resume();
    }

    if (gotPath) {
      return handleFile(subPath, fieldname, file, filename);
    }

    // If the path isn't sorted yet, stash this.
    pendingFiles.push({
      name: fieldname,
      file: file,
      originalFilename: filename
    });
  });

  req.busboy.on('finish', function () {
    res.render('uploadSuccess.template', {
      name: robotId,
      verb: isNew ? 'added' : 'updated'
    });
  });

  req.pipe(req.busboy);
}

module.exports = uploadRobot;
