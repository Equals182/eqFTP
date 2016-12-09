/*
 * Copyright (c) 2015 Equals182.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2, maxerr: 50  */
/*global define, brackets, Mustache, $, Promise*/
/*jslint white: true */

define(function (require, exports, module) {
  "use strict";

  /**
   * Including all needed modules
   */
  var AppInit = brackets.getModule("utils/AppInit"),
    ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
    FileSystem = brackets.getModule("filesystem/FileSystem"),
    FileUtils = brackets.getModule("file/FileUtils"),
    CommandManager = brackets.getModule("command/CommandManager"),
    Commands = brackets.getModule("command/Commands"),
    Menus = brackets.getModule("command/Menus"),
    ProjectManager = brackets.getModule("project/ProjectManager"),
    MainViewManager = brackets.getModule("view/MainViewManager"),
    PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
    NodeConnection = brackets.getModule("utils/NodeConnection"),
    EventEmitter = require('modules/events/index'),

    _ = require("node/node_modules/lodash/lodash"),

    strings = require("strings"),
    dateFormat = require("modules/date-format/date_format"),
    utils = require("modules/utils"),
    ui = require("modules/ui"),

    _defaultEqFTPFolder = brackets.app.getUserDocumentsDirectory(),
    _callbacks = {},
    _watching = [],
    _node;
  EventEmitter = new EventEmitter();

  /**
   * Creating eqftp and _version variables
   */
  var _version = "1.0";
  var eqftp = {
    ui: ui,
    utils: utils
  };
  eqftp.preferences = new function () {
    var self = this;
    self._value = {};
    
    self.p = PreferencesManager.getExtensionPrefs("eqFTP");
    self.get = function (path) {
      return _.get(self._value, path);
    };
    self.set = function (path, value) {
      _.set(self._value, path, value);
      self.p.set("eqFTP", self._value);
      self.p.save();
    };
    self.init = function () {
      self.p.definePreference("eqFTP", "object", {
        misc: {
          first_start: true,
          last_settings_file: ''
        }
      });
      self._value = self.p.get("eqFTP");
      return self._value;
    };
  }();
  /**
   * Adding events to eqftp
   */
  eqftp = _.assignIn(eqftp, EventEmitter);
  // Listening for all events on eqftp object
  eqftp.on('event', function (event) {
    if (!event) {
      return false;
    }
    if (event.action) {
      switch (event.action) {
        case 'ready:html':
          break;
        case 'ready:app':
          _node.domains.eqFTP.commands().done(function (commands) {
            if (_.isArray(commands)) {
              // Adding Domain commands to eqftp object
              commands.forEach(function (command) {
                _.set(eqftp, command.command, _node.domains.eqFTP[command.command]);
              });
              // Initiating Brackets' preferences
              eqftp.preferences.init();
              // Populating eqftp object to window for global use
              window.eqftp = eqftp;
              eqftp.settings.get(eqftp.preferences.get('misc.last_settings_file')).done(function (settings) {
                eqftp.settings = settings;
                _.forOwn(eqftp.settings.connections, function (connection, id) {
                  ui.dropdown.addItem({
                    title: connection.name,
                    host: connection.server,
                    user: connection.login,
                    id: id
                  });                  
                });
                // Proxy helps making easy requests like eqftp.connections['connection_id'].ls('/path'/);
                var ap = 
                eqftp.connections = new Proxy(eqftp.connections, {
                  get: function(connections, prop, receiver) {
                    if (prop in connections) {
                      return connections[prop];
                    } else if (prop in eqftp.settings.connections) {
                      // prop is id;
                      return (function (id) {
                        var p = new Proxy(eqftp.settings.connections[id], {
                          get: function (connection, prop, receiver) {
                            if (prop in connection) {
                              return connection[prop];
                            } else if (['ls', 'upload', 'download'].indexOf(prop) > -1) {
                              return function (params) {
                                return eqftp.connections.action(id, prop, arguments);
                              }
                            }
                            return connection[prop];
                          }
                        });
                        return p;
                      })(prop);
                    }
                    return {};
                  }
                });
              }).fail(function (err) {
                console.error(err);
              }).always(function () {
                console.log(arguments);
              });
            }
          });
          break;
      }
    }
  });
  eqftp.connect = function (id) {
    if (_.isEmpty(eqftp.connections[id])) {
      eqftp.emit('event', {
        action: 'connection:notexist',
        params: {id: id}
      });
      return false;
    }
    eqftp.connections.new(id)
      .done(function (id) {
        var path = (eqftp.connections[id].remotepath || '');
        eqftp.connections[id].ls(path).done(function (elements) {
          eqftp.ui.fileTree.add(elements, path);
        }).fail(function (err) {
          //not found
          console.log('NOT FOUND', arguments, path);
        });
      })
      .fail(function (err) {
        eqftp.emit('event', {
          action: 'connection:cantcreate',
          params: {
            id: id,
            err: err
          }
        });
      });
  };

  // Adding eqftp + listener to ui so we could keep entities separately
  ui.eqftp = eqftp;
  ui.eqftp.on('event', ui.events);
  
  /**
   * This starts when Brackets' html is ready
   */
  AppInit.htmlReady(function () {
    // Including CSS files
    ExtensionUtils.loadStyleSheet(module, "styles/ext.css");

    // Registering Commands
    CommandManager.register(strings.eqftp__context__upload, "eqftp.upload", function() {

    });

    // Creating context menus
    var project_contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU);
    project_contextMenu.addMenuDivider();
    project_contextMenu.addMenuItem("eqftp.upload");

    var working_contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_CONTEXT_MENU);
    working_contextMenu.addMenuDivider();
    working_contextMenu.addMenuItem("eqftp.upload");
    
    eqftp.emit('event', {
      action: 'ready:html'
    });
  });
  /**
   * This starts when Node is ready
   */
  AppInit.appReady(function () {
    // Adding "change" listener on watched paths
    FileSystem.on("change", function (e, file) {
      _watching.some(function (v, i) {
        var r = new RegExp('^' + v);
        if (r.test(file._path)) {
          var _id = utils.uniq();
          eqftp.queue.add({
            _id: _id,
            action: 'upload',
            localpath: file._path,
            callback: function (result) {
              if (result) {
                console.log('UPLOADED!!!!');
              }
            },
            queue_type: 'auto'
          });
          return true;
        }
      });
    });
    // Adding "rename" listener on watched paths
    FileSystem.on("rename", function (e, file) {
      _watching.some(function (v, i) {
        var r = new RegExp('^' + v);
        if (r.test(file._path)) {
          console.log('RENAME!', file._path);
          return true;
        }
      });
    });

    // Creating Node connection
    _node = new NodeConnection();
    function connectNode() {
      var connectionPromise = _node.connect(true);
      connectionPromise.fail(function (err) {
        console.error(err);
      });
      return connectionPromise;
    }
    function loadNodeFtp() {
      var path = ExtensionUtils.getModulePath(module, "node/ftpDomain");
      var loadPromise = _node.loadDomains([path], true);
      loadPromise.fail(function (err) {
        console.error(err);
      });
      loadPromise.done(function (done) {
        eqftp.emit('event', {
          action: 'ready:app'
        });
        
        // Adding listener to Node
        _node.on("eqFTP:event", function (event, params) {
          if (!params.action) {
            params.action = 'info';
          }
          switch(params.action) {
          }
          console.log('eqFTP:event', event, params);
        });
      });
      return loadPromise;
    }
    utils.chain(connectNode, loadNodeFtp);
  });
});