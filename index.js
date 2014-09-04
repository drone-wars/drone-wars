var express = require('express');
var busboy = require('connect-busboy');
var uploadRobot = require('./middleware/uploadRobot');
var getRobotIds = require('./middleware/getRobotIds');

var app = express();

app.use(express.static('frontend', { 'index': ['index.html'] }));
app.use(busboy());

app.post('/upload-robot', uploadRobot);
app.get('/robot-ids', getRobotIds);

app.listen(3000);
