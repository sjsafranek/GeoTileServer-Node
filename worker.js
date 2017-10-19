#!/usr/bin/env node

// https://github.com/mapnik/node-mapnik/issues/346

var spawn = require('threads').spawn;

function worker(input, done) {

    // import modules
    var fs = require('fs');
    var path = require('path');
    var mapnik = require('mapnik');
    var process = require('process');
    var mercator = require('sphericalmercator');

    var pid = process.pid;

    // Check for stylesheet
    if (!fs.existsSync(input.stylesheet)) {
        res.status(404).send('Datasource not found');
        return;
    }

    // register shapefile plugin
    if (mapnik.register_default_input_plugins) mapnik.register_default_input_plugins();
    if (mapnik.register_default_fonts) mapnik.register_default_fonts();

    // check for cached file
    // send if exists
    if ('png' == input.ext) {

        // build caching directories
        if (!fs.existsSync(input.cache)){
            fs.mkdirSync(input.cache);
        }
        if (!fs.existsSync(input.cache + '/' + input.ds)){
            fs.mkdirSync(input.cache + '/' + input.ds);
        }
        if (!fs.existsSync(input.cache + '/' + input.ds + '/' + input.z)){
            fs.mkdirSync(input.cache + '/' + input.ds + '/' + input.z);
        }
        if (!fs.existsSync(input.cache + '/' + input.ds + '/' + input.z + '/' + input.x)){
            fs.mkdirSync(input.cache + '/' + input.ds + '/' + input.z + '/' + input.x);
        }

        // check for cached tile
        var cache_file = input.cache + '/' + input.ds + '/' + input.z + '/' + input.x + '/' + input.y + '.png';
        if (fs.existsSync(cache_file)){
            file_path = fs.realpathSync(cache_file);
            done({tile: file_path});
            return;
        }

        // Render tile
        var projection = new mercator({
            size: input.size
        });
        var bounds = projection.bbox(input.x, input.y, input.z, false, '900913');
        var map = new mapnik.Map(input.size, input.size);
        var tile = new mapnik.Image(256, 256);
        map.loadSync(input.stylesheet);

        map.zoomToBox(bounds);
        map.render(tile, function(err, tile) {
            if (err) throw err;
            var cache_dir = input.cache + '/' + input.ds + '/' + input.z + '/' + input.x + '/' ;
            var file_path = process.cwd() + '/' + cache_dir + '/' + input.y + '.png';
            tile.save(cache_file, 'png');
            done({tile: file_path});
        });

    }

    else if ('pbf' == input.ext) {
        var vTile = new mapnik.VectorTile(input.z, input.x, input.y);

    }
}


function TileWorker() {
    return spawn(worker);
}

exports.TileWorker = TileWorker;
