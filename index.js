var express = require('express');
var busboy = require('connect-busboy');
var fs = require('fs');
var path = require('path');
var uploadRobot = require('./middleware/uploadRobot');

var app = express();

app.use(express.static('frontend', { 'index': ['index.html'] }));
app.use(busboy());
app.post('/upload-robot', uploadRobot);

app.listen(3000);
