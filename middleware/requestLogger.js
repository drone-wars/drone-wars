'use strict';

var log = require('bole')('request');
var uuid = require('uuid');

function requestLogger(req, res, next) {
  var t0 = Date.now();
  var logger = log(uuid.v4());

  logger.debug({ message: { req: req } });

  req.log = logger;

  var writeHead = res.writeHead;

  res.writeHead = function () {
    var dt = Date.now() - t0;

    res.setHeader('X-Response-Time', dt + 'ms');

    logger.debug({ message: { res: res } });
    logger.debug('Responded in ' + dt + ' ms.');
    writeHead.apply(res, arguments);
  };

  next();
}


module.exports = requestLogger;
