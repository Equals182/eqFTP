/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */
/*global */

(function () {
  "use strict";

  var EFTP = require('./libs/eftp'),
    utils = require('./libs/utils.js'),
    fs = require('fs'),
    CryptoJS = require("crypto-js"),
    chokidar = require('chokidar'),
    _ = require("lodash");

  var _domainManager;

  _.isJSON = function (input) {
    try { JSON.parse(input); } catch (e) { return false; }
    return true;
  };

  var AES = {
    encrypt: function (input, passphrase) {
      return JSON.parse(AES._formatter.stringify(CryptoJS.AES.encrypt(JSON.stringify(input), passphrase)));
    },
    decrypt: function (input, passphrase) {
      return CryptoJS.AES.decrypt(AES._formatter.parse(JSON.stringify(input)), passphrase).toString(CryptoJS.enc.Utf8);
    },
    _formatter: {
      stringify: function (cipherParams) {
        // create json object with ciphertext
        var jsonObj = {
          ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
        };
        // optionally add iv and salt
        if (cipherParams.iv) {
          jsonObj.iv = cipherParams.iv.toString();
        }
        if (cipherParams.salt) {
          jsonObj.s = cipherParams.salt.toString();
        }
        // stringify json object
        return JSON.stringify(jsonObj);
      },
      parse: function (jsonStr) {
        // parse json string
        var jsonObj = JSON.parse(jsonStr);
        // extract ciphertext from json object, and create cipher params object
        var cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
        });
        // optionally extract iv and salt
        if (jsonObj.iv) {
          cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
        }
        if (jsonObj.s) {
          cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
        }
        return cipherParams;
      }
    }
  };
  
  var _commands = new function () {
    var self = this;
    self._ = [];
    self.add = function (command) {
      var toAdd = true;
      self._.some(function (v, i) {
        if (_.isEqual(v, command)) {
          toAdd = false;
          return true;
        }
      });
      if (toAdd) {
        self._.push(command);
      }
      return self._;
    };
    self.get = function () {
      return self._;
    };
  }();
  var eqftp = {};
  eqftp.commands = _commands.get;
  eqftp.cache = {};
  eqftp.settings = new function () {
    var self = this;
    self.password = undefined;
    self.currentSettingsFile = false;
    self.settings = false;

    self._process = function (data, direction, password) {
      if (!direction || !data || _.isError(data)) {
        return new Error('Data or direction is empty');
      }
      data = _.cloneDeep(data);

      switch (direction) {
        case 'fromJSON':
          if (!_.isString(data)) {
            return new Error('NOTASTRING');
          } else {
            if (!_.isJSON(data)) {
              return new Error('NOTAJSON');
            } else {
              data = JSON.parse(data);
              if (data.misc.encrypted === true) {
                if (!password) {
                  password = self.password;
                }
                if (!password) {
                  return new Error('NEEDPASSWORD');
                }
                data.connections = AES.decrypt(data.connections, password);
                if (_.isJSON(data.connections)) {
                  data.connections = JSON.parse(data.connections);
                  return data;
                } else {
                  return new Error('DECRYPTEDNOTAJSON');
                }
              } else {
                return data;
              }
            }
          }
        case 'toJSON':
          if (!_.isObject(data)) {
            return new Error('NOTANOBJECT');
          } else {
            if (data.misc.encrypted === true) {
              if (!password) {
                password = self.password;
              }
              if (!password) {
                return new Error('NEEDPASSWORD');
              }
              data.connections = AES.encrypt(data.connections, password);
              data = JSON.stringify(data, null, 4);
            } else {
              data = JSON.stringify(data, null, 4);
            }
          }
          break;
      }
      return data;
    };
    self.get = function (settingsFile, password) {
      if (password === null) {
        password = undefined;
      }
      self.password = password;
      if (settingsFile) {
        settingsFile = utils.normalize(settingsFile);
        if (!fs.existsSync(settingsFile)) {
          throw new Error('FILENOTEXIST');
        }
        settingsFile = fs.realpathSync(settingsFile);
        self.settings = self._process(fs.readFileSync(settingsFile, {encoding: 'UTF-8'}), 'fromJSON', password);
        if (_.isError(self.settings)) {
          throw new Error(self.settings);
        }
        eqftp.connections._set(self.settings.connections);
        self.currentSettingsFile = settingsFile;
      }
      if (!self.settings) {
        throw new Error('NOSETTINGS');
      }
      return self.settings;
    };
    self.set = function (settings, password) {
      settings = _.defaultsDeep(settings, _.cloneDeep(self.settings), {
        main: {
          // TODO!!
        }
      });
      _.unset(settings, ['settings_file', 'master_password']);
      var settingsFile = utils.normalize(self.currentSettingsFile);
      /*
      if (!fs.existsSync(settingsFile)) {
        throw new Error('Passed file does not exists');
      }
      */
      settingsFile = fs.realpathSync(settingsFile);
      settings = self._process(settings, 'toJSON', password);
      fs.writeFile(settingsFile, settings, {encoding: 'UTF-8'}, function (err, data) {
        if (err) {
          _domainManager.emitEvent("eqFTP", "event", {
            action: 'settings:save:fail',
            data: {
              file: utils.normalize(settingsFile),
              err: err
            }
          });
        } else {
          _domainManager.emitEvent("eqFTP", "event", {
            action: 'settings:save:success',
            data: {
              file: utils.normalize(settingsFile),
              data: data
            }
          });
        }
      });
      return true;
    };
    self.setConnection = function (connection) {
      var defaults = {
        protocol: 'ftp',
        port: 21,
        autoupload: true,
        check_difference: true
      };
      console.log(connection);
      if (!_.isObject(connection)) {
        throw new Error('NOTANOBJECT');
      }
      if (!connection.id) {
        connection.id = utils.uniq();
        connection = _.defaults(connection, defaults);
      } else {
        var _c = _.get(eqftp, ['connections', 'a', connection.id]);
        if (!_c) {
          throw new Error('CONNECTIONIDNOTEXIST');
        }
        connection = _.defaults(connection, _c, defaults);
      }
      if (!_.isConnection(connection)) {
        throw new Error('NOTACONNECTIONOBJECT');
      }
      eqftp.connections._set(connection.id, connection);
      self.settings.connections[connection.id] = connection;
      
      self.settings.localpaths = {};
      _.forOwn(self.settings.connections, function (connection, id) {
        self.settings.localpaths[id] = connection.localpath;
      });
      
      if (self.currentSettingsFile) {
        self.set(self.currentSettingsFile, self.settings, self.password);
      }
      return connection;
    };
  }();
  eqftp.connections = new function () {
    var self = this;
    self._ = {}; // with methods
    self.$ = {}; // pure settings
    self.t = {}; // only temporary
    self.a = {}; // pure settings + temporary
    
    self.event_update = _.throttle(function () {
      _domainManager.emitEvent("eqFTP", "event", {
        action: 'connection:update',
        data: self.a
      });
    }, 1000, {
      leading: false,
      trailing: true
    });
    self.newTmp = function (params, callback) {
      if (!_.isObject(params)) {
        if (_.isString(params)) {
          params = utils.parseConnectionString(params);
          if (!params) {
            callback('Passed argument[1] is not a valid connection string', {});
            return false;
          }
        } else {
          callback('Passed argument[1] is not an connection object', {});
          return false;
        }
      }
      if (_.isConnection) {
        if (!_.isConnection(params)) {
          params.id = utils.uniq();
          params.localpath = eqftp.settings.get().main.projects_folder;
        }
        if (!_.isConnection(params)) {
          callback('Passed argument[1] is not an connection object', {});
        }
      }
      params.name = params.login + '@' + params.server;
      params.isTmp = true;
      if (!_.findKey(self.t, function (o) {
        return _.isEqualConnections(o, params);
      })) {
        self.t[params.id] = _.cloneDeep(params);
        self._set(params.id, self.t[params.id]);
        self.a = _.defaultsDeep(self.$, self.t);
        self.event_update();
      }
      callback(null, params);
    };
    self._set = function (id, settings) {
      if (_.isUndefined(settings) && _.isObject(id)) {
        // bulk resetting
        _.forOwn(self._, function (c, id) {
          c.close();
        });
        self._ = {};
        self.$ = {};
        _.forOwn(id, function (c, id) {
          self._set(id, c);
        });
      } else {
        // setting by one
        if (self._[id]) {
          self._[id].close();
        }
        self.$[id] = _.cloneDeep(settings);
        self._[id] = new Proxy(
          _.defaultsDeep(_.cloneDeep(settings), {
            isBusy: false,
            _watch: function () {
              if (settings.isTmp) {
                return undefined;
              }
              var w = chokidar.watch(settings.localpath, {
                ignored: settings.ignore_list.splitIgnores(),
                persistent: true,
                awaitWriteFinish: true,
                cwd: settings.localpath,
                ignoreInitial: true
              });
              w.on('add', function (path, stats) {
                path = utils.normalize(path);
                console.log('add', path, stats);
              })
              .on('change', function (path, stats) {
                console.log('change', path, stats);
                path = utils.normalize(path);
                if (!/^\//.test(path)) {
                  path = utils.normalize(settings.localpath + '/' + path);
                }
                if (!eqftp.cache._recently_downloaded) {
                  eqftp.cache._recently_downloaded = [];
                }
                var rd = _.findIndex(eqftp.cache._recently_downloaded, {id: id, localpath: path});
                if (rd > -1) {
                  eqftp.cache._recently_downloaded.splice(rd, 1);
                  return false;
                }
                self._[id].upload(path, function () {}, function () {});
              })
              .on('unlink', function (path, stats) {
                path = utils.normalize(path);
                console.log('unlink', path, stats);
              });
              return w;
            }(),
            _queue: [],
            queue: new function () {
              var queue = this;
              queue.q = [];
              
              queue.get = function () {
                return queue.q;
              };
              queue.add = function (queuer, prepend) {
                if (!queue.q) {
                  queue.q = [];
                }
                if (!queuer.qid) {
                  queuer.qid = utils.uniq() + '-' + _.uniqueId();
                }
                if (prepend) {
                  queue.q.unshift(queuer);
                } else {
                  queue.q.push(queuer);
                }
                _domainManager.emitEvent("eqFTP", "event", {
                  action: 'queue:update',
                  data: eqftp.queue.get()
                });
                queue.next();
              };
              queue.next = function () {
                if (queue.q && queue.q.length > 0) {
                  if (!self._[id].isBusy) {
                    self._[id].isBusy = true;
                  } else {
                    // not going anywhere were busy
                    return false;
                  }
                  var f = _.findIndex(queue.q, {queue: 'a'});
                  if (f < 0) {
                    return false;
                  }
                  var queuer = _.nth(queue.q, f),
                      args = queuer.args,
                      callback = _.nth(args, -2),
                      progress = _.nth(args, -1);

                  var finisher = function (err, data) {
                    var i = _.findIndex(queue.q, {qid: queuer.qid});
                    if (i > -1) {
                      queuer = (_.pullAt(queue.q, i))[0];
                      if (err) {
                        queuer.queue = 'f';
                        queuer.err = err;
                        queue.add(queuer, true);
                      }
                    }
                    self._[id].isBusy = false;
                    if (!err) {
                      _domainManager.emitEvent("eqFTP", "event", {
                        action: 'queue:update',
                        data: eqftp.queue.get()
                      });
                    }
                    queue.next();
                    callback(err, data);
                  };
                  var cb = function (err, data) {
                    // POST-HOOKS
                    switch(queuer.act) {
                      case 'ls':
                        if (!err) {
                          var path = args[0];
                          if (!/^\//.test(path)) {
                            path = self._[id]._server.getRealRemotePath(path);
                          }
                          var d = [],
                              f = [];
                          data.forEach(function (v, i) {
                            data[i].id = queuer.id;
                            data[i].fullPath = utils.normalize(path + '/' + v.name);

                            switch (v.type) {
                              case 'f':
                                f.push(data[i]);
                                break;
                              case 'd':
                                d.push(data[i]);
                                break;
                            }
                          });
                          d = _.orderBy(d, ['name', 'asc']);
                          f = _.orderBy(f, ['name', 'asc']);
                          data = _.concat(d, f);
                        }
                        break;
                      case 'download':
                        if (!err) {
                          eqftp.cache._recently_downloaded = _.unionWith(eqftp.cache._recently_downloaded, [{
                            id: id,
                            localpath: args[0].localpath,
                            remotepath: args[0].remotepath
                          }], function (a, b) {
                            return (a.id === b.id && a.localpath === b.localpath);
                          });
                          if (self._[id].isTmp) {
                            if (!eqftp.cache._tmp_downloaded) {
                              eqftp.cache._tmp_downloaded = [];
                            }
                            eqftp.cache._tmp_downloaded.push({
                              params: args[0],
                              connection: self.$[id]
                            });
                            if (!self._[id]._watch) {
                              self._[id]._watch = chokidar.watch(args[0].localpath);
                              self._[id]._watch
                                .on('change', function (path) {
                                  console.log('change tmp', path, arguments);
                                });
                            } else {
                              self._[id]._watch.add(args[0].localpath);
                            }
                          }
                        }
                        break;
                    }

                    _domainManager.emitEvent("eqFTP", "event", {
                      action: 'connection:' + queuer.act,
                      data: queuer
                    });

                    finisher(err, data);
                  };
                  var pr = function (err, data) {
                    progress(err, data);
                  };

                  args.splice(-2, 2, cb, pr);
                  self._[id].open(function (err) {
                    if (!err) {
                      self._[id]._server[queuer.act](...args);
                    } else {
                      finisher(err);
                    }
                  });
                }
              };
            }(),
            open: function (cb) {
              if (_.isFunction(cb)) {
                cb = _.once(cb);
              }
              if (self._[id]._server) {
                cb(null, id);
                return true;
              }
              self._[id]._server = new EFTP();

              self._[id]._server.on('ready', function () {
                self._[id]._startpath = self._[id]._server.currentPath;
                _domainManager.emitEvent("eqFTP", "event", {
                  action: 'connection:ready',
                  data: self.a[id]
                });
                cb(null, id);
              });
              self._[id]._server.on('close', function () {
                _domainManager.emitEvent("eqFTP", "event", {
                  action: 'connection:close',
                  data: self.a[id]
                });
                cb('Forced connection closing');
                _.unset(self._[id], '_server');
              });
              self._[id]._server.on('error', function (err) {
                _domainManager.emitEvent("eqFTP", "event", {
                  action: 'connection:error',
                  data: {
                    connection: self.a[id],
                    error: err
                  }
                });
                cb(err);
                self._[id].close();
              });
              self._[id]._server.on('progress', function (data) {
                _domainManager.emitEvent("eqFTP", "event", {
                  action: 'queue:progress',
                  data: data
                });
              });

              var settings = {
                  host: self.a[id].server,
                  type: self.a[id].protocol,
                  port: self.a[id].port || 21,
                  username: self.a[id].login,
                  password: self.a[id].password,
                  debugMode: true
              };
              if (self.a[id].rsa) {
                  settings.privateKey = self.a[id].rsa;
              }
              self._[id]._server.connect(settings);
            },
            close: function () {
              if (self._[id]) {
                if (self._[id]._watch) {
                  self._[id]._watch.close();
                }
                if (self._[id]._server) {
                  self._[id]._server.close();
                }
              }
              return true;
            },
            resolveLocalpath: function (remotepath) {
              var filename = remotepath.replace(RegExp("^" + (self._[id].remotepath || self._[id]._startpath || '')), '');
              if (self._[id].isTmp) {
                if (!eqftp.cache._tmp_downloaded) {
                  eqftp.cache._tmp_downloaded = [];
                }
                var tmp = _.findIndex(eqftp.cache._tmp_downloaded, {params: {remotepath: remotepath}, connection: {id: id}});
                if (tmp > -1) {
                  filename = utils.getNamepart(eqftp.cache._tmp_downloaded[tmp].params.localpath);
                } else {
                  filename = id + '.' + utils.uniq() + '.' + utils.getNamepart(filename, 'filename');
                }
              }
              return utils.normalize(self._[id].localpath + '/' + filename);
            },
            resolveRemotepath: function (localpath) {
              if (!eqftp.cache._tmp_downloaded) {
                eqftp.cache._tmp_downloaded = [];
              }
              if (self._[id].isTmp) {
                var tmp = _.findIndex(eqftp.cache._tmp_downloaded, {params: {localpath: localpath}, connection: {id: id}});
                if (tmp > -1) {
                  return eqftp.cache._tmp_downloaded[tmp].params.remotepath;
                }
              }
              return utils.normalize((self._[id].remotepath || self._[id]._startpath) + '/' + localpath.replace(RegExp("^" + (self._[id].localpath || '')), ''));
            }
          }),
        {
          get: function (o, method) {
            if (method in o) {
              return o[method];
            }
            switch (method) {
              case 'ls':
              case 'download':
              case 'upload':
              case 'pwd':
                return function () {
                  var prepend = false;
                  if (['upload', 'download'].indexOf(method) < 0) {
                    // for everything except downloads and uploads
                    prepend = true;
                  }
                  var args = [...arguments],
                      callback = _.nth(args, -2),
                      progress = _.nth(args, -1),
                      qid = utils.uniq() + '-' + _.uniqueId();

                  // PRE-HOOKS
                  switch(method) {
                    case 'download':
                      args[0] = {
                        qid: qid,
                        remotepath: args[0],
                        localpath: self._[id].resolveLocalpath(args[0])
                      };
                      break;
                    case 'upload':
                      args[0] = {
                        qid: qid,
                        localpath: args[0],
                        remotepath: self._[id].resolveRemotepath(args[0])
                      };
                      break;
                  }

                  self._[id].queue.add({
                    qid: qid,
                    id: id,
                    act: method,
                    args: args,
                    queue: 'a'
                  }, prepend);
                };
                break;
            }
          }
        });
        self.a = _.defaultsDeep(self.$, self.t);
        self.event_update();
      }
    };
    self._get = function (id) {
      if (!id) {
        return self._; // giving nothing at all returning all saved connections WITH methods
      } else if (id === true) {
        return self.a; // giving true as argument returning all saved connections without methods
      } else {
        return self._[id];
      }
    };
    self._getByLocalpath = function (localpath, callback) {
      if (!callback) {
        callback = function () {};
      }
      var tmp = _.findIndex(eqftp.cache._tmp_downloaded, {params: {localpath: localpath}});
      if (tmp > -1) {
        callback(null, eqftp.cache._tmp_downloaded[tmp].connection.id);
        return eqftp.cache._tmp_downloaded[tmp].connection.id;
      } else {
        var deepest = 0,
            сonn = '';
        _.forOwn(self.$, function (connection, id) {
          var r = RegExp('^' + utils.escapeRegExp(connection.localpath));
          if (r.test(localpath) && connection.localpath.levels() > deepest) {
            deepest = connection.localpath.levels();
            сonn = id;
          }
        });
        if (deepest > 0) {
          callback(null, сonn);
          return сonn;
        }
      }
      callback('Can\'t find related connection to given path: ' + localpath, {});
      return false;
    };
    /*
    return function (id, settings) {
      if (!settings) {
        return self._get(id);
      } else {
        return self._set(id, settings);
      }
    };
    */
  }();
  eqftp.queue = {
    get: function () {
      var r = [],
          connections = eqftp.connections._get();
      _.forOwn(connections, function (c, id) {
        var cq = c.queue.get();
        cq.forEach(function (queuer) {
          r.push({
            id: queuer.id,
            qid: queuer.qid,
            args: _.filter(queuer.args, _.negate(_.isFunction)),
            act: queuer.act,
            queue: queuer.queue
          });
        });
      });
      return r;
    }
  };

  function init(DomainManager) {
    if (!DomainManager.hasDomain("eqFTP")) {
      DomainManager.registerDomain("eqFTP", {major: 1, minor: 0});
    }
    _domainManager = DomainManager;

    DomainManager.registerEvent(
      "eqFTP",
      "event"
    );
    
    [
      {
        command: "commands",
        async: false,
        description: 'Returns list of registered commands',
        parameters: [],
        returns: [
          { name: "Commands", type: "array", description: "List of registered commands" }
        ]
      },
      {
        command: "settings.get",
        async: false,
        description: 'Returns settings from given file or cached settings object',
        parameters: [
          { name: "settingsFile", type: "string", description: "file:// url to the Settings file" },
          { name: "password", type: "string", description: "Password to decrypt settings file. Optional." }
        ],
        returns: [
          { name: "settings", type: "object", description: "Settings object" }
        ]
      },
      {
        command: "settings.set",
        async: false,
        description: 'Saves given settings to a loaded file',
        parameters: [
          { name: "settings", type: "object", description: "Settings object" },
          { name: "password", type: "string", description: "Password to decrypt settings file. Optional." }
        ],
        returns: [
          { name: "settings", type: "object", description: "Settings object" }
        ]
      },
      {
        command: "settings.setConnection",
        async: false,
        description: 'Saves given connection to internal cache and to current settings file',
        parameters: [
          { name: "connection", type: "object", description: "Stardart connection object" }
        ],
        returns: [
          { name: "connection", type: "object", description: "Connection object" }
        ]
      },
      {
        command: "connections",
        async: true,
        description: 'Connects to server via id or credentials',
        parameters: [
          { name: "id", type: "string", description: "Connecion id or ftp credentials." }
        ],
        returns: [],
        cmd: function () {
          var args = [...arguments],
              path = args.shift(),
              cb = _.nth(args, -2),
              pr = _.nth(args, -1);
          if (path < 1) {
            var all = eqftp.connections._get();
            if (_.isFunction(cb)) {
              cb(null, all);
            }
            return all;
          } else {
            if (eqftp.connections._get(path[0])) {
              // we have such connection
              var f = _.get(eqftp.connections._get(path[0]), _.tail(path));
              if (f) {
                f(...args);
                return true;
              }
            } else {
              var f = _.get(eqftp.connections, path);
              if (f) {
                f(...args);
                return true;
              }
            }
          }
          if (_.isFunction(cb)) {
            cb('No such connection or method', {});
          }
        }
      }
    ].forEach(function (c) {
      DomainManager.registerCommand(
        "eqFTP",
        c.command,
        (c.cmd || _.get(eqftp, c.command)),
        c.async,
        c.description,
        c.parameters,
        c.returns
      );
      _commands.add(c);
    });
  }
  exports.init = init;
}());