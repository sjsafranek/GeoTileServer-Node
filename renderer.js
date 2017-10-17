#!/usr/bin/env node

// https://github.com/mapnik/node-mapnik/issues/346

var spawn = require('threads').spawn;

function TileWorker() {
    return spawn(function(input, done) {
        var fs = require('fs');
        var path = require('path');
        var mapnik = require('mapnik');
        var mercator = require('sphericalmercator');

        // register shapefile plugin
        if (mapnik.register_default_input_plugins) mapnik.register_default_input_plugins();
        if (mapnik.register_default_fonts) mapnik.register_default_fonts();

        projection = new mercator({
            size: input.size
        });

        // render tile
        var stylesheet = 'data/' + input.ds + '/stylesheet.xml';
        if (!fs.existsSync(stylesheet)) {
            res.status(404).send('Datasource not found');
            return;
        }

        // if ('pbf' == input.ext) {
        //     var vTile = new mapnik.VectorTile(input.z, input.x, input.y);
        // }

        // check for cached file
        // send if exists
        var cache_file = input.cache + '/' + input.ds + '/' + input.z + '/' + input.x + '/' + input.y + '.png';
        if (fs.existsSync(cache_file)){
            file_path = fs.realpathSync(cache_file);
            done({tile: file_path});
            return;
        }

        var bounds = projection.bbox(input.x, input.y, input.z, false, '900913');
        var map = new mapnik.Map(input.size, input.size);
        var tile = new mapnik.Image(256, 256);
        map.loadSync(stylesheet);

        map.zoomToBox(bounds);
        map.render(tile, function(err, tile) {
            if (err) throw err;

            if (!fs.existsSync(input.cache + '/' + input.ds)){
                fs.mkdirSync(input.cache + '/' + input.ds);
            }
            if (!fs.existsSync(input.cache + '/' + input.ds + '/' + input.z)){
                fs.mkdirSync(input.cache + '/' + input.ds + '/' + input.z);
            }
            if (!fs.existsSync(input.cache + '/' + input.ds + '/' + input.z + '/' + input.x)){
                fs.mkdirSync(input.cache + '/' + input.ds + '/' + input.z + '/' + input.x);
            }

            tile.save(cache_file, 'png');

            file_path = fs.realpathSync(cache_file);
            done({tile: file_path});
        });
    });
}

exports.TileWorker = TileWorker;
