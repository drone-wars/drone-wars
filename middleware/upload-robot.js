'use strict';

const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

async function uploadRobot(req, res) {
  const robotId = slugify(req.fields['robot-id'], { lower: true, remove: /[#$*_+~.()'"!:@]/g });
  const directoryPath = path.join(__dirname, '..', 'uploads', robotId);

  await fs.promises.mkdir(directoryPath, { recursive: true });

  if (req.files.body.size) {
    const extension = req.files.body.name.split('.').pop();
    await fs.promises.rename(req.files.body.path, path.join(directoryPath, `body.${extension}`));
  } else {
    const body = Buffer.from(req.fields.generatedBody.split(',').pop(), 'base64');
    await fs.promises.writeFile(path.join(directoryPath, 'body.png'), body);
  }

  if (req.files.turret.size) {
    const extension = req.files.turret.name.split('.').pop();
    await fs.promises.rename(req.files.turret.path, path.join(directoryPath, `turret.${extension}`));
  } else {
    const turret = Buffer.from(req.fields.generatedTurret.split(',').pop(), 'base64');
    await fs.promises.writeFile(path.join(directoryPath, 'turret.png'), turret);
  }

  await fs.promises.rename(req.files.src.path, path.join(directoryPath, 'src.js'));

  res.set('content-type', 'text/html');
  res.send(`
    <!doctype html>
    <html>
      <body>
        <h1>${robotId} successfully added!</h1>
        <div>
          <a href="/upload.html">Again again again!</a>
        </div>
      </body>
    </html>
  `);
}

module.exports = uploadRobot;
