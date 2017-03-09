/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */
/*global $ */

(function (root, factory) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = exports = factory();
  }
  else if (typeof define === "function" && define.amd) {
    // AMD
    define(factory);
  }
  else {
    // Global (browser)
  }
}(this, function () {
  "use strict";
  var _ = require("lodash"),
      utils = require('./utils.js'),
      fetch = require('node-fetch');
  
  var tracker = new function () {
    var self = this;
    self.userId = undefined;
    self.params = {};
    
    var _timeout = undefined,
        // lol this is shitty protection against bots I guess
        // pls don't ddos my ip, please. thank you.
        _addr = (182 + 3) + '.' + (73 * 2) + '.' + 171 + '.' + ((73 * 2) - 100),
        action = function () {
          /**
          * Basically I need this just to know how many people using my extension at the moment
          * Your personal information is untouched.
          * It only sends userId (generated string) and version (hardcoded string) to my little server
          * You can always check this code below to be sure
          */
          /**
           * TRACKING IS ON HOLD FOR NOW
           *
          var data = _.defaultsDeep({
            userId: self.userId
          }, self.params);
          fetch('http://' + _addr + '/eqFTP', {
            method: 'POST',
            body: JSON.stringify(data)
          }).then(function (res) {
            return res.json();
          }).then(function (json) {
            console.log('tracked', json);
            if (_.isJSON(json)) {
              console.log('json', json);
            }
          }).catch(function(err) {
            console.log(err);
          });
          */
        };
    self._start = function () {
      if (self.userId && !_timeout) {
        action();
        _timeout = setInterval(action, (10 * 60 * 1000));
      }
    };
    self.init = function (id, params) {
      if (!id) {
        id = utils.uniq();
      }
      if (!self.userId) {
        self.userId = id;
      }
      if (params && !_.isEmpty(params)) {
        self.params = params;
      }
      self._start();
      return self.userId;
    };
  }();
  return tracker;
}));
