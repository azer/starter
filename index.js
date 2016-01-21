"use strict";

var debug = require("local-debug")('starter');
var struct = require("new-struct");
var loop = require("serial-loop");
var formatText = require("format-text");
var path = require("path");
var fs = require("fs");
var mix = require("mix-objects");
var serially = require("serially");

class Starter {
  constructor (name, project, folder, form) {
    this.name = name;
    this.project = project;
    this.folder = folder;
    this.form = form;
  }

  copy (folder, callback) {
    debug('Copying from starter "%s" to project "%s"', this.folder, this.targetFolder());
    this.project.exec('cp -r {0}/. {1}/.', this.folder, this.targetFolder(), callback);
  }

  format (text, context) {
    var vars = this.variables();

    if (context) {
      mix(vars, [context]);
    }

    return formatText(text, formatVars(vars));
  }

  prefix (str, obj) {
    return this.project.prefix('kik:' + str, obj);
  }

  rename (map, callback) {
    var targets = Object.keys(map);
    loop(targets.length, each, callback);

    function each (done, index) {
      var from = path.join(this.targetFolder(), targets[index]);
      var to = path.join(this.targetFolder(), this.format(map[targets[index]]));

      debug('Renaming %s to %s', from, to);

      fs.rename(from, to, done);
    }
  }

  render (files, callback) {
    var self = this;
    loop(files.length, each, callback);

    function each (done, index) {
      var filename = path.join(self.targetFolder(), files[index]);
      debug('Rendering %s', filename);

      fs.readFile(filename, function (error, content) {
        if (error) return done(error);

        fs.writeFile(filename, self.format(content), done);
      });
    }
  }

  serial() {
    return serially(this);
  }

  parallel() {
    return parallelly(this);
  }

  targetFolder () {
    if (!this.subfolder) return this.project.folder;
    return path.join(this.project.folder, this.subfolder);
  }

  variables () {
    var p = this.project.variables();
    var s = this.prefix(this.name + ':', mix({}, [this.context, {
      name: this.name,
      folder: this.targetFolder()
    }]));

    return mix(p, [s]);
  }
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

module.exports = Starter;
