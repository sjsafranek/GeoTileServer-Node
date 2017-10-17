#!/usr/bin/env node

// vector tile server
// https://www.npmjs.com/package/tilesplash

var express = require('express');
var bodyParser = require('body-parser');
var TileWorker = require('./renderer.js').TileWorker;

var CACHE_DIR = "cache";
const TILE_SIZE = 256;
var port = process.env.PORT || 3000;        // set our port


const app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/', function (req, res) {
    // res.send('Hello World!')
    res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/:ds/:z/:x/:y.:ext', function(req, res) {

    var worker = TileWorker();

    // handle canceled requests
    req.on("close", function() {
        console.log('canceled', this.params);
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
            cache: CACHE_DIR,
            size: TILE_SIZE
        })
        .on('message', function(response) {
            res.sendFile(response.tile);
            worker.kill();
        })
        .on('error', function(error) {
            console.log(error)
            res.status(500).send(error);
        });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/tms/1.0', router);

// START THE SERVER
// =============================================================================
app.listen(port, function () {
    console.log('Magic happens on port ' + port + '!');
});
