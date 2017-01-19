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
    FileUtils = brackets.getModule("file/FileUtils"),
    CommandManager = brackets.getModule("command/CommandManager"),
    Commands = brackets.getModule("command/Commands"),
    Menus = brackets.getModule("command/Menus"),
    ProjectManager = brackets.getModule("project/ProjectManager"),
    MainViewManager = brackets.getModule("view/MainViewManager"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
    LanguageManager = brackets.getModule("language/LanguageManager"),
    NodeConnection = brackets.getModule("utils/NodeConnection"),
    NativeApp = brackets.getModule("utils/NativeApp"),
    EventEmitter = require('modules/events/index'),

    //_ = require("node/node_modules/lodash/lodash"),
    utils = require("node/libs/utils"),
    ps = require("node/node_modules/perfect-scrollbar/dist/js/perfect-scrollbar"),
    _ = utils._,

    strings = require("strings"),
    ui = require("./modules/ui"),

    _defaultEqFTPFolder = brackets.app.getUserDocumentsDirectory(),
    _callbacks = {},
    _node;
  ui.ps = ps;
  EventEmitter = new EventEmitter();

  /**
   * Creating eqftp and _version variables
   */
  var _version = "1.0.0-beta.1";
  var eqftp = {
    ui: ui,
    utils: utils,
    _openInBrowser: function (path) {
      return NativeApp.openURLInDefaultBrowser(path);
    },
    _getProjectRoot: function () {
      var root = ProjectManager.getProjectRoot();
      if (root) {
        return root._path;
      }
      return false;
    }
  };
  
  /**
   * Preferences object
   * eqftp.preferences.get(path) - returns preference
   * eqftp.preferences.set(path, value) - saves preference
   * eqftp.preferences.init() - inilializes preference
   */
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
          last_settings_file: '',
          debug: false
        }
      });
      self._value = self.p.get("eqFTP");
      return self._value;
    };
  }();
  // Initiating Brackets' preferences
  eqftp.preferences.init();
  
  /**
   * debug function, helps turning debug on and off on fly
   */
  var _debugState = !!eqftp.preferences.get('misc.debug');
  var debug = function () {
    if (_debugState === true) {
      console.log('[eqFTP main]', ...arguments);
    }
  };
  
  /**
   * Log object - simple way to log things
   * eqftp.log(text, type) - where @text is a plain text and @type is [error|info|success]
   */
  eqftp.log = function (text, type) {
    switch (type) {
      case 'error':
        console.error(text);
        break;
    }
    if (eqftp.ui && eqftp.ui.log) {
      eqftp.ui.log.add({
        time: utils.date_format(new Date(), 'H:i:s'),
        text: text,
        type: type
      });
    }
  };
  eqftp._cache = {
    tmpfiles: [],
    _pendingPasswordActions: []
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
          // When everything is ready to go, including ftpDomain
          // We're asking domain for available commands
          _node.domains.eqFTP.commands().done(function (commands) {
            /**
             * Setting our commands first
             */
            _.set(eqftp, 'settings.create', function () {
              // eqftp.settings.create() - fires Save File dialog and sends command to ftpDomain with resolved path
              debug('eqftp.settings.create fired');
              eqftp.ui.explorer.saveFile(strings.eqftp__wlcm__welcome_saveFile_title, eqftp._home, 'settings.eqftp', function (err, path) {
                debug('Save File dialog callback', err, path);
                if (err) {
                  // if error occured - log it
                  eqftp.log(ui.m(strings.eqftp__log__settings_create_fail, {
                    filename: 'settings.eqftp',
                    path: utils.normalize(eqftp._home + '/settings.eqftp')
                  }), 'error');
                  return false;
                }
                if (path) {
                  // if path is resolved - saving settings
                  debug('Do we have eqftp.settings.set?', _.has(eqftp, 'settings.set'));
                  if (_.has(eqftp, 'settings.set')) {
                    eqftp.settings.set({}, undefined, path).done(function () {
                      // when done - hiding welcome screen and loading saved file
                      ui.welcome.hide();
                      eqftp.settings.load(path);
                    });
                  }
                }
              });
            });
            _.set(eqftp, 'settings.open', function () {
              // eqftp.settings.open() - fires Open File dialog
              eqftp.ui.explorer.openFile(strings.eqftp__wlcm__welcome_saveFile_title, eqftp._home, function (err, path) {
                if (!err && path) {
                  // if there were no error and path resolved - hiding welcome screen and loading file
                  ui.welcome.hide();
                  if (_.has(eqftp, 'settings.load')) {
                    eqftp.settings.load(path);
                  }
                } else if (err) {
                  // if error occured - log it
                  eqftp.log(ui.m(strings.eqftp__log__settings_load__dialog_error, {
                    err: err
                  }), 'error');
                  return false;
                }
              });
            });
            _.set(eqftp, 'settings.load', function (file, password, callback) {
              debug('eqftp.settings.load fired', file, password, callback);
              // eqftp.settings.load(file, password) - loads given file to settings
              if (!callback) {
                callback = function () {};
              }
              
              if (!_.has(eqftp, 'settings.get')) {
                debug('eqftp object doesn\'t have settings.get method');
                return false;
              }
              debug('getting settings', file, password);
              eqftp.settings.get(file, password)
                .done(function (settings) {
                  debug('got settings', settings);
                  eqftp._settings = settings;
                  _debugState = !!_.get(settings, 'main.debug');
                  eqftp.preferences.set('misc.debug', _debugState);

                  var _s = {};
                  [
                    "main.projects_folder",
                    "main.date_format",
                    "main.debug",
                    "main.open_project_connection",
                    "misc.encrypted"
                  ].forEach(function (s) {
                    _s[s] = _.get(eqftp._settings, s);
                  });
                  _s['settings_file'] = file;
                  debug('passing necessary settings to ui.settings.set', _s);
                  ui.settings.set(_s);

                  debug('setting misc.last_settings_file to preferences', file);
                  eqftp.preferences.set('misc.last_settings_file', file);
                  eqftp.log(ui.m(strings.eqftp__log__settings_load_success, {
                    filename: utils.getNamepart(file, 'filename')
                  }), 'info');
                  callback(null, settings);
                })
                .fail(function (err) {
                  debug('couldn\'t load settings file', file, err);
                  switch (err) {
                    case 'NEEDPASSWORD':
                      ui.password.show(function (password) {
                        eqftp.settings.load(file, password, callback);
                      });
                      break;
                    case 'NOTASETTINGSFILE':
                    case 'FILENOTEXIST':
                    case 'NOTAJSON':
                    case 'NOTANOBJECT':
                      ui.welcome.show();
                      break;
                    default:
                      console.log(err);
                      eqftp.log(ui.m(strings.eqftp__log__settings_load_error, {
                        filename: utils.getNamepart(file, 'filename')
                      }), 'error');
                      break;
                  }
                  callback(err);
                })
                .always(function () {
                  // Proxy helps making easy requests like eqftp.connections['connection_id'].ls('/path'/);
                  debug('creating eqftp.connections Proxy using eqftp.connections object', eqftp.connections);
                  eqftp.connections = new Proxy({
                    __do: eqftp._connections
                  }, {
                    get: function(connections, prop, receiver) {
                      if (prop in connections) {
                        return connections[prop];
                      } else if (eqftp._settings && prop in eqftp._settings.connections) {
                        // prop is id;
                        return (function (id) {
                          var p = new Proxy(eqftp._settings.connections[id], {
                            get: function (connection, prop, receiver) {
                              if (prop in connection) {
                                return connection[prop];
                              } else if (['ls', 'upload', 'download', 'queue.next', 'remove'].indexOf(prop) > -1) {
                                return function (params) {
                                  return eqftp.connections.__do(_.concat(id, prop.split('.')), ...arguments);
                                }
                              }
                              return connection[prop];
                            }
                          });
                          return p;
                        })(prop);
                      } else {
                        return function (params) {
                          return eqftp.connections.__do([prop], ...arguments);
                        }
                      }
                      return {};
                    }
                  });
                });
            });
            if (_.isArray(commands)) {
              // Adding Domain commands to eqftp object
              debug('adding domain commands to eqftp object');
              commands.forEach(function (command) {
                _.set(eqftp, command.command, _node.domains.eqFTP[command.command]);
              });
              debug('now eqftp object should contain functions: ', commands, eqftp);
              // Populating eqftp object to window for global use
              debug('populating global eqftp object');
              window.eqftp = {
                ui: eqftp.ui,
                connect: eqftp.connect,
                openFolder: eqftp.openFolder,
                download: eqftp.download,
                upload: eqftp.upload,
                connectionRemove: eqftp.connectionRemove,
                contexts: eqftp.contexts,
                settings: {
                  removeConnection: function () {
                    eqftp.settings.removeConnection();
                  },
                  setConnection: function () {
                    eqftp.settings.setConnection(...arguments).done(function (connection) {
                      debug('connection set', connection);
                      eqftp.ui.connections.editor.close();
                      eqftp.log(ui.m(strings.eqftp__log__settings_connection_save_success, {
                        name: connection.name
                      }), 'info');
                    }).fail(function (err) {
                      if (err) {
                        switch(err) {
                          case 'NOSERVERSET':
                            eqftp.log(ui.m(strings.eqftp__log__settings_connection_save_error, {
                              err: strings['eqftp__ERR__' + err]
                            }), 'error');
                            break;
                          default:
                            console.error(err);
                            break;
                        }
                      }
                    });
                  },
                  set: function (settings) {
                    debug('window.eqftp.settings.set fired');
                    var master_password = _.get(settings, 'master_password');
                    _.unset(settings, 'master_password');
                    eqftp.settings.set(settings, master_password).done(function (settings) {
                      debug('window.eqftp.settings.set succeed');
                    }).fail(function (err) {
                      debug('window.eqftp.settings.set failed', arguments);
                    });
                  },
                  create: eqftp.settings.create,
                  load: eqftp.settings.load,
                  open: eqftp.settings.open
                },
                queue: eqftp.queue,
                _home: brackets.app.getUserDocumentsDirectory(),
                _getProjectRoot: eqftp._getProjectRoot
              };
              debug('window.eqftp:', window.eqftp);
              debug('ready to load settings. getting last settings file from preferences');
              var file = eqftp.preferences.get('misc.last_settings_file');
              debug('last file', file);
              if (!file) {
                debug('no file found, showing welcome screen');
                ui.welcome.show();
              } else {
                debug('file found, loading settings');
                eqftp.settings.load(file);
              }
              EditorManager.on('activeEditorChange', function (event, editor_new, editor_old) {
                var localpath = _.get(editor_new, 'document.file._path');
                if (localpath) {
                  eqftp.connections._getByLocalpath(localpath).done(function (connection) {
                    if (connection && !connection._isIgnored && connection.check_difference && connection.server) {
                      eqftp.comparator.compare(connection.id, undefined, localpath).done(function (res) {
                        if (res.isDifferent) {
                          eqftp.comparator.prompt(res.element).done(function (action) {

                          }).fail(function (err) {
                            console.error(err);
                          });
                        }
                      }).fail(function (err) {
                        console.error(err);
                      });
                    }
                  }).fail(function (err) {
                    // cant find connection related to this file
                  });
                }
              });
            }
          });
          break;
        case 'connection:ready':
          eqftp.log(ui.m(strings.eqftp__log__connection_ready, {
            name: event.data.name,
            id: event.data.id
          }), 'info');
          break;
        case 'connection:error':
          eqftp.log(ui.m(strings.eqftp__log__connection_error, {
            name: event.data.connection.name,
            id: event.data.connection.id,
            error: event.data.error.code
          }), 'error');
          ui.toast.new({
            string: "eqftp__toast__connection_error",
            name: event.data.connection.name,
            button: {
              text: strings.eqftp__controls__showlog,
              callback: function () {
                ui.panel.open();
                ui.log.open();
              }
            }
          }, event.action, 'request');
          break;
        case 'connection:close':
          eqftp.log(ui.m(strings.eqftp__log__connection_close, {
            name: event.data.name,
            id: event.data.id
          }), 'info');
          break;
        case 'connection:update':
          _.set(eqftp, '_settings.connections', event.data);
          debug('set eqftp._settings.connections', eqftp._settings.connections);
          if (eqftp._settings) {
            if (_.has(eqftp, '_cache._pendingPasswordActions')) {
              eqftp._cache._pendingPasswordActions.forEach(function (v) {
                _.result(eqftp, v);
              });
            }
            _.set(eqftp, '_cache._pendingPasswordActions', []);
            var items = [];
            _.forOwn(eqftp._settings.connections, function (connection, id) {
              items.push({
                title: connection.name,
                host: connection.server,
                user: connection.login,
                id: id
              });
            });
            ui.search.dropdown.setItems(items);
          }
          break;
        case 'connection:download':
          var status = (event.data.queue === 'a' ? 'success' : 'error');
          eqftp.log(ui.m(strings['eqftp__log__download_' + status], {
            filename: utils.getNamepart(event.data.args[0].localpath, 'filename')
          }), status);
          if (ui.panel.state === 'closed') {
            ui.toast.new({
              string: "eqftp__toast__download_success",
              filename: utils.getNamepart(event.data.args[0].localpath, 'filename')
            }, event.action, 'info');
          }
          break;
        case 'connection:upload':
          var status = (event.data.queue === 'a' ? 'success' : 'error');
          eqftp.log(ui.m(strings['eqftp__log__upload_' + status], {
            filename: utils.getNamepart(event.data.args[0].localpath, 'filename')
          }), status);
          if (ui.panel.state === 'closed') {
            ui.toast.new({
              string: "eqftp__toast__upload_success",
              filename: utils.getNamepart(event.data.args[0].localpath, 'filename')
            }, event.action, 'info');
          }
          break;
        case 'settings:reload':
          console.log(event);
          break;
        case 'settings:save:success':
          eqftp.log(ui.m(strings.eqftp__log__settings_save_success, {
            filename: utils.getNamepart(event.data.file, 'filename')
          }), 'info');
          
          _.set(eqftp, '_settings.main', _.get(event.data.settings, 'main'));
          _.set(eqftp, '_settings.misc', _.get(event.data.settings, 'misc'));
          _debugState = !!_.get(eqftp, '_settings.main.debug');
          eqftp.preferences.set('misc.debug', _debugState);
          ui.fileTree.updateDateFormat();
          break;
        case 'settings:save:fail':
          eqftp.log(ui.m(strings.eqftp__log__settings_save_fail, {
            filename: utils.getNamepart(event.data.file, 'filename')
          }), 'error');
          break;
        case 'settings:forcedneedpassword':
          debug('forced password');
          if (_.has(event, 'data')) {
            if (!_.has(eqftp, '_cache._pendingPasswordActions')) {
              _.set(eqftp, '_cache._pendingPasswordActions', []);
            }
            eqftp._cache._pendingPasswordActions.push(event.data);
            eqftp._cache._pendingPasswordActions = _.uniq(eqftp._cache._pendingPasswordActions);
          }
          ui.panel.open();
          ui.password.show(function (password) {
            debug('password entered', password);
            var file = eqftp.preferences.get('misc.last_settings_file');
            debug('loading settings', file, password);
            eqftp.settings.load(file, password);
          });
          break;
        case 'comparator:difference:prompt':
          ui.panel.open();
          ui.dialog.new({
            title: ui.m(strings.eqftp__dialog__file_difference_title, {
              filename: utils.getNamepart(event.data.element.localpath, 'filename')
            }),
            text: strings.eqftp__dialog__file_difference_text,
            actions: [
              {
                title: strings.eqftp__controls__difference_upload,
                callback: function () {
                  debug('difference_upload');
                  eqftp.comparator.resolve(event.data.cid, 'difference_upload');
                }
              },
              {
                title: strings.eqftp__controls__difference_download,
                callback: function () {
                  debug('difference_download');
                  eqftp.comparator.resolve(event.data.cid, 'difference_download');
                }
              },
              {
                title: strings.eqftp__controls__difference_show_diff,
                callback: function () {
                  debug('difference_show_diff');
                  eqftp.comparator.resolve(event.data.cid, 'difference_show_diff');
                },
                keepDialog: true
              },
              {
                title: strings.eqftp__controls__difference_open_both,
                callback: function () {
                  debug('difference_open_both');
                  eqftp.comparator.resolve(event.data.cid, 'difference_open_both');
                },
                keepDialog: true
              },
              {
                title: strings.eqftp__controls__skip,
                callback: function () {
                  debug('skip');
                  eqftp.comparator.resolve(event.data.cid, 'skip');
                }
              }
            ],
          });
          break;
        case 'comparator:splitview':
          if (MainViewManager.getPaneCount() < 2) {
            MainViewManager.setLayoutScheme(1, 2);
          }
          if (_.has(event, 'data.pane1')) {
            CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {
              fullPath: event.data.pane1.file,
              paneId: "first-pane",
              options: {
                noPaneActivate: true
              }
            }).done(function() {
              LanguageManager.setLanguageOverrideForPath(event.data.pane2.file, LanguageManager.getLanguageForExtension(event.data.pane2.extension));
            }).fail(function (err) {
              eqftp.log(ui.m(strings.eqftp__log__open_file_error, {
                filename: event.data.pane2.file,
                error: err
              }), 'error');
            });
          }
          if (_.has(event, 'data.pane2')) {
            CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {
              fullPath: event.data.pane2.file,
              paneId: "second-pane",
              options: {
                noPaneActivate: true
              }
            }).done(function() {
              LanguageManager.setLanguageOverrideForPath(event.data.pane2.file, LanguageManager.getLanguageForExtension(event.data.pane2.extension));
            }).fail(function (err) {
              eqftp.log(ui.m(strings.eqftp__log__open_file_error, {
                filename: event.data.pane2.file,
                error: err
              }), 'error');
            });
          }
          break;
        case 'comparator:diffview':
          ui.difference.open(event.data);
          break;
      }
    }
  });
  eqftp.connect = function (id) {
    var cb = _.once(function () {
      if (_.isEmpty(eqftp.connections[id])) {
        eqftp.emit('event', {
          action: 'connection:notexist',
          params: {id: id}
        });
        return false;
      }
      var path = (eqftp.connections[id].remotepath || '');
      ui.fileTree.reset();
      eqftp.openFolder(id, path, function (err, elements) {
        if (err) {
          eqftp.openFolder(id, '', function (err) {
            if (!err) {
              eqftp.ui.panel.switchTo('file-tree');
              if (_.has(eqftp, '_settings.main.open_project_connection') && !!_.get(eqftp, '_settings.main.open_project_connection')) {
                ProjectManager.openProject(eqftp.connections[id].localpath);
              }
            }
          });
        } else {
          eqftp.ui.panel.switchTo('file-tree');
          if (_.has(eqftp, '_settings.main.open_project_connection') && !!_.get(eqftp, '_settings.main.open_project_connection')) {
            ProjectManager.openProject(eqftp.connections[id].localpath);
          }
        }
      });
    });
    if (_.isObject(id)) {
      eqftp.connections.newTmp(id).done(function (connection) {
        id = connection.id;
        cb();
      }).fail(function (err) {
        eqftp.log(ui.m(strings.eqftp__log__connection_tmp_error, {
          error: err
        }), 'error');
      });
    } else {
      cb();
    }
  };
  eqftp.openFolder = function (id, path, callback, refresh) {
    if (!id) {
      return false;
    }
    if (!_.isString(path)) {
      path = '';
    }
    if (!_.isEmpty(ui.fileTree._rendered) && _.has(ui.fileTree._rendered, path) && !refresh) {
      ui.fileTree.itemToggle(path);
    } else {
      eqftp.connections[id].ls(path).done(function (elements) {
        ui.fileTree.add(elements, path);
        ui.fileTree.title.set(eqftp.connections[id].name);
        if (_.isFunction(callback)) {
          callback(null, elements);
        }
      }).fail(function (err) {
        if (_.isFunction(callback)) {
          callback(err);
        }
        console.error('NOT FOUND', arguments, path);
      });
    }
  };
  eqftp.download = function (id, remotepath, open) {
    var args = [...arguments];
    eqftp.connections[id].download(remotepath).done(function (data) {
      //success
      if (open) {
        _.delay(function () {
          CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: data.localpath, paneId: MainViewManager.getActivePaneId(), options: {noPaneActivate: ((args && args[3] && args[3].shiftKey) ? true : false)}});
        }, 300);
      }
    }).fail(function (err) {
      //error
    });
  };
  eqftp.upload = function (localpath) {
    eqftp.connections._getByLocalpath(localpath).done(function (connection) {
      var args = [...arguments];
      eqftp.connections[connection.id].upload(localpath).done(function (data) {
        //success
      }).fail(function (err) {
        //error
      });
    }).fail(function (err) {
      // cant find connection related to this file
    });
  };
  eqftp.connectionRemove = function (id) {
    if (!id) {
      return false;
    }
    eqftp.ui.dialog.new({
      title: ui.m(strings.eqftp__dialog__connection_removing_title, {
        name: eqftp.connections[id].name
      }),
      text: strings.eqftp__dialog__connection_removing_text,
      actions: [
        {
          title: strings.eqftp__controls__remove,
          callback: function () {
            eqftp.ui.connections.editor.close();
            eqftp.connections[id].remove();
          }
        },
        {
          title: strings.eqftp__controls__cancel,
          callback: function () {}
        }
      ],
    });
  };
  eqftp.contexts = {
    fileTreeElement: function () {
      var el = $(event.target).closest('[eqftp-path]'),
          path = el.attr('eqftp-path'),
          id = el.attr('eqftp-id'),
          type = 'folder';
      if (el.hasClass('eqftp-fileTree__item_file')) {
        type = 'file';
      }
      switch (type) {
        case 'file':
          ui.context.open([
            {
              text: strings.eqftp__context__fileTreeElement__download_open,
              callback: function () {
                eqftp.download(id, path, true);
              },
              shortcut: ""
            },
            {
              text: strings.eqftp__context__fileTreeElement__download,
              callback: function () {
                eqftp.download(id, path, false);
              },
              shortcut: ""
            }
          ], undefined, el);
          break;
        case 'folder':
          ui.context.open([
            {
              text: strings.eqftp__context__fileTreeElement__open,
              callback: function () {
                eqftp.openFolder(id, path);
              },
              shortcut: ""
            },
            {
              text: strings.eqftp__context__fileTreeElement__refresh,
              callback: function () {
                eqftp.openFolder(id, path, function () {}, true);
              },
              shortcut: ""
            }
          ], undefined, el);
          break;
        default:
          return false;
          break;
      }
      return true;
    },
    connectionElement: function () {
      var el = $(event.target).closest('.eqftp-connections__item'),
          id = el.attr('id');
      ui.context.open([
        {
          text: strings.eqftp__context__connectionElement__edit,
          callback: function () {
            ui.connections.edit(id);
          },
          shortcut: ""
        },
        {
          text: strings.eqftp__context__connectionElement__connect,
          callback: function () {
            eqftp.connect(id);
          },
          shortcut: ""
        },
        {
          text: strings.eqftp__context__connectionElement__remove,
          callback: function () {
            eqftp.connectionRemove(id);
          },
          shortcut: ""
        }
      ], undefined, el);
    },
    queueElement: function () {
      var el = $(event.target).closest('.eqftp-queue__item'),
          qid = $(el).attr('eqftp-id');
      if (el.hasClass('eqftp-queue__item_error')) {
        ui.context.open([
          {
            text: strings.eqftp__context__queueElement__restart,
            callback: function () {
              eqftp.queue.restart(qid);
            },
            shortcut: ""
          },
          {
            text: strings.eqftp__context__queueElement__remove,
            callback: function () {
              eqftp.queue.remove(qid);
            },
            shortcut: ""
          }
        ], undefined, el);
      }
    }
  };

  // Adding eqftp + listener to ui so we could keep entities separately
  ui.eqftp(eqftp).on('event', ui.events);
  
  /**
   * This starts when Brackets' html is ready
   */
  AppInit.htmlReady(function () {
    // Including CSS files
    ExtensionUtils.loadStyleSheet(module, "assets/main.min.css");

    // Registering Commands
    CommandManager.register(strings.eqftp__context__upload, "eqftp.upload", function() {
      var fileEntry = ProjectManager.getSelectedItem(),
        localpath = fileEntry._path;
      eqftp.upload(localpath);
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
          debug('eqFTP:event', params);
          eqftp.emit('event', params);
        });
      });
      return loadPromise;
    }
    utils.chain(connectNode, loadNodeFtp);
  });
});