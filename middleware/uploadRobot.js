'use strict';

const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

function checkRobotFolder(subPath, callback) {
  fs.stat(subPath, (err, stats) => {
    if (err && err.code !== 'ENOENT') {
      return callback(err);
    }

    if (stats && stats.isDirectory()) {
      return callback(null, true);
    }

    fs.mkdir(subPath, err => callback(err, false));
  });
}

function handleFile(subPath, name, file, originalFilename) {
  const extension = path.extname(originalFilename);

  // Direct the possible files to particular file names.
  switch (name) {
  case 'src':
    return file.pipe(fs.createWriteStream(path.join(subPath, 'src.js')));

  case 'body':
    return file.pipe(fs.createWriteStream(path.join(subPath, `body${extension}`)));

  case 'turret':
    return file.pipe(fs.createWriteStream(path.join(subPath, `turret${extension}`)));

  default:
    return file.resume();
  }
}

function uploadRobot(req, res) {
  const pendingFiles = [];
  const pendingBase64s = {};
  let robotId;
  let subPath;
  let gotPath;
  let isNew = true;

  function handleBase64(subPath, name, base64) {
    /*** http://stackoverflow.com/a/20272545 ***/
    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    if (matches.length !== 3) {
      return console.error(new Error('Invalid data string')); // eslint-disable-line no-console
    }

    const decoded = Buffer.from(matches[2], 'base64');
    /*******************************************/

    fs.writeFile(path.join(subPath, name), decoded, err => {
      if (err) {
        console.error(err, `Error saving Base64 with subPath: ${subPath}, name: ${name}`); // eslint-disable-line no-console
      }
    });
  }

  function initalizeRobotDir(fieldValue) {
    robotId = slugify(fieldValue, { lower: true, remove: /[#$*_+~.()'"!:@]/g });
    subPath = path.join(__dirname, '..', 'uploads', robotId);

    checkRobotFolder(subPath, (err, overwritten) => {
      if (err) {
        console.error(err, 'Error checking robot folder.'); // eslint-disable-line no-console
        return res.status(500).end();
      }

      if (overwritten) {
        isNew = false;
      }

      gotPath = true;

      // Process any stashed files.
      for (const { name, file, originalFilename } of pendingFiles) {
        handleFile(subPath, name, file, originalFilename);
      }

      // Process any stashed base 64 images.
      for (const [name, value] of Object.entries(pendingBase64s)) {
        handleBase64(subPath, name, value);
      }
    });
  }

  function onBase64Uploaded(name, base64) {
    if (gotPath) {
      return handleBase64(subPath, name, base64);
    }

    pendingBase64s[name] = base64;
  }

  req.busboy.on('field', (key, value) => {
    if (key === 'robot-id') {
      return initalizeRobotDir(value);
    }

    if (key === 'generatedBody' && value.length) {
      return onBase64Uploaded('body.png', value);
    }

    if (key === 'generatedTurret' && value.length) {
      return onBase64Uploaded('turret.png', value);
    }
  });

  req.busboy.on('file', (fieldname, file, filename) => {
    // Return early if no file specified
    if (!filename) {
      return file.resume();
    }

    if (gotPath) {
      return handleFile(subPath, fieldname, file, filename);
    }

    // If the path isn't sorted yet, stash this.
    pendingFiles.push({
      name: fieldname,
      file,
      originalFilename: filename
    });
  });

  req.busboy.on('finish', () => {
    res.render('uploadSuccess.template', {
      name: robotId,
      verb: isNew ? 'added' : 'updated'
    });
  });

  req.pipe(req.busboy);
}

module.exports = uploadRobot;
