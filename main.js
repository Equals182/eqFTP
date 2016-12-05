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
    CryptoJS = require("modules/crypto-js/crypto-js"),
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
    utils: utils,
  };
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
          window.eqftp = eqftp;
          ui.dropdown.addItem({
            host: 'host',
            title: 'title',
            user: 'user',
            id: 'id'
          });
          eqftp.n['settings.get']().done(function (settings) {
            eqftp.settings = settings;
          }).fail(function (err) {
            console.error(err);
          }).always(function () {
            console.log(arguments);
          });
          break;
      }
    }
  });

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
        eqftp.n = _node.domains.eqFTP;
        eqftp.emit('event', {
          action: 'ready:app'
        });
        
        // Adding listener to Node
        _node.on("eqFTP:event", function (event, params) {
          if (!params.action) {
            params.action = 'info';
          }
          console.log('eqFTP:event', event, params);
        });
      });
      return loadPromise;
    }
    utils.chain(connectNode, loadNodeFtp);
  });
});