var debug = require("local-debug")('starter');
var struct = require("new-struct");
var loop = require("serial-loop");
var formatText = require("format-text");
var path = require("path");
var fs = require("fs");
var mix = require("mix-objects");
var serially = require("serially");

var Starter = struct({
  copy: copy,
  format: format,
  prefix: prefix,
  rename: rename,
  render: render,
  variables: variables,
  serially: serially
});

module.exports = Starter;

function copy (starter, folder, callback) {
  debug('Copying from starter "%s" to project "%s"', starter.folder, starter.project.folder);
  starter.project.exec('cp -r {0}/. .', folder, callback);
}

function format (starter, text) {
  return formatText(text, formatVars(starter.variables()));
}

function rename (starter, map, callback) {
  var targets = Object.keys(map);
  loop(targets.length, each, callback);

  function each (done, index) {
    var from = path.join(starter.project.folder, targets[index]);
    var to = path.join(starter.project.folder, starter.format(map[targets[index]]));

    debug('Renaming %s to %s', from, to);

    fs.rename(from, to, done);
  }
}

function render (starter, files, callback) {
  loop(files.length, each, callback);

  function each (done, index) {
    var filename = path.join(starter.project.folder, files[index]);
    debug('Rendering %s', filename);

    fs.readFile(filename, function (error, content) {
      if (error) return done(error);

      fs.writeFile(filename, starter.format(content), done);
    });
  }
}

function prefix (starter, str, obj) {
  return starter.project.prefix('kik:' + str, obj);
}

function variables (starter) {
  var p = starter.project.variables();
  var s = starter.prefix(starter.name + ':', mix({}, [starter.context, {
    name: starter.name,
    folder: starter.folder
  }]));

  return mix(p, [s]);
}

function formatVars (obj) {
  var result = {};
  var key;

  for (key in obj) {
    if (typeof obj[key] == 'object') {
      result[key] = JSON.stringify(obj[key], null, '  ');
    } else {
      result[key] = obj[key];
    }
  }

  return result;
}
