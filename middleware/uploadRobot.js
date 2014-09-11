'use strict';

var fs = require('fs');
var path = require('path');
var string = require('string');

function checkRobotFolder(subPath, callback) {
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

// http://stackoverflow.com/a/20272545
function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid data string');
  }

  return new Buffer(matches[2], 'base64');
}

function handleBase64(subPath, name, base64) {
  fs.writeFile(path.join(subPath, name), decodeBase64Image(base64), function(err){
    if(err){
        console.error('Error saving Base64', subPath, name, err);
    }
  });
}

function uploadRobot(req, res) {
  var robotId;
  var subPath;
  var pendingFiles = [];
  var pendingBase64s = {};
  var gotPath;
  var isNew = true;

  function initalizeRobotDir(fieldValue){
      robotId = string(fieldValue).slugify().s;
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

        // Process any stashed base 64 images.
        Object.keys(pendingBase64s).forEach(function (name) {
          handleBase64(subPath, name, pendingBase64s[name]);
        });
      });
  }

  function onBase64Uploaded(name, base64){
      if(gotPath){
        handleBase64(subPath, name, base64);
      } else {
        pendingBase64s[name] = base64;
      }
  }

  req.busboy.on('field', function (key, value) {
    if (key === 'robot-id') {
      initalizeRobotDir(value);
    } else if(key === 'generatedBody' && value.length){
      onBase64Uploaded('body.png', value);
    } else if(key === 'generatedTurret' && value.length){
      onBase64Uploaded('turret.png', value);
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
