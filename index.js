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
  targetFolder: targetFolder,
  serially: serially
});

module.exports = Starter;

function copy (starter, folder, callback) {
  debug('Copying from starter "%s" to project "%s"', starter.folder, starter.targetFolder());
  starter.project.exec('cp -r {0}/. {1}/.', folder, starter.targetFolder(), callback);
}

function format (starter, text, context) {
  var vars = starter.variables();

  if (context) {
    mix(vars, [context]);
  }

  return formatText(text, formatVars(vars));
}

function rename (starter, map, callback) {
  var targets = Object.keys(map);
  loop(targets.length, each, callback);

  function each (done, index) {
    var from = path.join(starter.targetFolder(), targets[index]);
    var to = path.join(starter.targetFolder(), starter.format(map[targets[index]]));

    debug('Renaming %s to %s', from, to);

    fs.rename(from, to, done);
  }
}

function render (starter, files, callback) {
  loop(files.length, each, callback);

  function each (done, index) {
    var filename = path.join(starter.targetFolder(), files[index]);
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

function targetFolder (starter) {
  if (!starter.subfolder) return starter.project.folder;
  return path.join(starter.project.folder, starter.subfolder);
}

function variables (starter) {
  var p = starter.project.variables();
  var s = starter.prefix(starter.name + ':', mix({}, [starter.context, {
    name: starter.name,
    folder: starter.targetFolder()
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
