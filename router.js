#!/usr/bin/env node

// router.js
var express = require('express');
var logger = require('./logger.js').logger;

log = logger('router');

// call the local packages
var config = require('./settings.js').config;
var TileWorker = require('./worker.js').TileWorker;

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/', function (req, res) {
    log.info({
        request: {
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            path: req.path,
            userAgent: req.headers['user-agent']
        }
    });
    res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/:ds/:z/:x/:y.:ext', function(req, res) {
    log.info({
        request: {
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            path: req.path,
            userAgent: req.headers['user-agent'],
            status: 'opened'
        }
    });

    var worker = TileWorker();

    // handle canceled requests
    req.on("close", function() {
        log.info({
            request: {
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                path: req.path,
                userAgent: req.headers['user-agent'],
                status: 'closed'
            }
        });
        worker.kill();
    });

    // handle response on separate thread
    worker
        .send({
            ds: req.params.ds,
            x: req.params.x,
            y: req.params.y,
            z: req.params.z,
            ext: req.params.ext,
            cache: config.CACHE_DIR,
            size: config.TILE_SIZE,
            stylesheet: 'data/' + req.params.ds + '/stylesheet.xml'
        })
        .on('message', function(response) {
            res.sendFile(response.tile);
            worker.kill();
        })
        .on('error', function(error) {
            log.error({
                error: {
                    data: error
                }
            });
            res.status(500).send(error);
        });
});

// exports
exports.router = router;
