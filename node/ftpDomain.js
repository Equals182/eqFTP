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
  eqftp.settings = new function () {
    var self = this;
    self.settings = false;

    self._process = function (data, direction, password) {
      if (!direction || !data) {
        return new Error('Data or direction is empty');
      }
      data = _.cloneDeep(data);

      switch (direction) {
        case 'fromJSON':
          if (!_.isString(data)) {
            return new Error('Passed data is not a string');
          } else {
            if (!_.isJSON(data)) {
              return new Error('Passed data is not a valid JSON');
            } else {
              data = JSON.parse(data);
              if (data.misc.encrypted === true) {
                if (_.isUndefined(password)) {
                  return new Error('Password was not passed');
                }
                data.connections = AES.decrypt(data.connections, password);
                if (_.isJSON(data.connections)) {
                  data.connections = JSON.parse(data.connections);
                  return data;
                } else {
                  return new Error('Decrypted data is not a valid JSON');
                }
              } else {
                return data;
              }
            }
          }
        case 'toJSON':
          if (!_.isObject(data)) {
            return new Error('Passed data is not an object');
          } else {
            if (data.misc.encrypted === true) {
              if (_.isUndefined(password)) {
                return new Error('Password was not passed');
              }
              data.connections = AES.encrypt(data.connections, password);
              data = JSON.stringify(data);
            } else {
              data = JSON.stringify(data);
            }
          }
          break;
      }
      return data;
    };
    self.get = function (settingsFile, password) {
      if (settingsFile) {
        settingsFile = utils.normalize(settingsFile);
        if (!fs.existsSync(settingsFile)) {
          throw new Error('Passed file does not exists');
        }
        settingsFile = fs.realpathSync(settingsFile);
        self.settings = self._process(fs.readFileSync(settingsFile, {encoding: 'UTF-8'}), 'fromJSON', password);
        eqftp.connections.init(self.settings.connections);
      }
      if (!self.settings) {
        throw new Error('No settings loaded');
      }
      return self.settings;
    };
    self.setConnection = function (connection) {
      var defaults = {
        protocol: 'ftp',
        port: 21,
        autoupload: true,
        check_difference: true
      };
      if (!_.isObject(connection)) {
        throw new Error('Passed connection is not an object');
      }
      if (!connection.id) {
        connection.id = utils.uniq();
        connection = _.defaults(connection, defaults);
      } else {
        var _c = _.get(eqftp, ['connections', '_all', connection.id]);
        if (!_c) {
          throw new Error('Passed connection\'s id doesn\'t exist');
        }
        connection = _.defaults(_c, connection, defaults);
      }
      self.settings.connections[connection.id] = connection;
      eqftp.connections.init(self.settings.connections);
      console.log(self._process(self.settings, 'toJSON', ''));
    };
  }();
  eqftp.connections = new Proxy({
    _current: {},
    _all: {},
    _c_settings: {},
    _c_tmp: {},
    _tmp_downloaded: [],
    _recently_downloaded: []
  }, {
    get: function (obj, action) {
      if (action in obj) {
        return obj[action];
      }
      switch (action) {
        case 'init':
          return function (connections) {
            _.forOwn(obj._current, function (connection, id) {
              eqftp.connections[id].close();
            });
            obj._c_settings = _.clone(connections);
            obj._all = _.defaults(obj._c_settings, obj._c_tmp, _.isEqualConnections);
            _.forOwn(obj._all, function (connection, id) {
              if (!obj._all[id].isTmp) {
                if (!obj._all[id]._watch) {
                  obj._all[id]._watch = chokidar.watch(obj._all[id].localpath, {
                    ignored: obj._all[id].ignore_list.splitIgnores(),
                    persistent: true,
                    awaitWriteFinish: true
                  });
                  _.delay(function() {
                    obj._all[id]._watch
                      .on('add', function (path, stats) {
                        path = utils.normalize(path);
                        console.log('add', path, stats);
                      })
                      .on('change', function (path, stats) {
                        path = utils.normalize(path);
                        var rd = _.findIndex(eqftp.connections._recently_downloaded, {id: id, localpath: path});
                        if (rd > -1) {
                          eqftp.connections._recently_downloaded.splice(rd, 1);
                          return false;
                        }
                        eqftp.connections[id].upload(path, function () {}, function () {});
                      })
                      .on('unlink', function (path, stats) {
                        path = utils.normalize(path);
                        console.log('unlink', path, stats);
                      });
                  }, 500);
                }
              }
            });
            _domainManager.emitEvent("eqFTP", "event", {
              action: 'connection:update',
              data: obj._all
            });
            eqftp.queue = new function () {
              var self = this;
              if (!_.isObject(eqftp.connections._current)) {
                return [];
              }
              self.q = [];
              
              self.get = function (id) {
                if (id && eqftp.connections._current[id]) {
                  return eqftp.connections._current[id]._queue;
                }
                self.q = [];
                _.forOwn(eqftp.connections._current, function (connection, id) {
                  if (connection._queue && _.isArray(connection._queue)) {
                    connection._queue.forEach(function (queuer) {
                      self.q.push({
                        id: queuer.id,
                        qid: queuer.qid,
                        args: _.filter(queuer.args, _.negate(_.isFunction)),
                        act: queuer.act,
                        queue: queuer.queue
                      });
                    });
                  }
                });
                return self.q;
              };
            }();
          };
        case 'tmp':
          return function (params, callback) {
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
            if (!_.findKey(obj._c_tmp, function (o) {
              return _.isEqualConnections(o, params);
            })) {
              obj._c_tmp[params.id] = params;
              obj._all = _.merge(obj._c_settings, obj._c_tmp);
              _domainManager.emitEvent("eqFTP", "event", {
                action: 'connection:update',
                data: obj._all
              });
            }
            callback(null, params);
          };
          break;
        case 'getByLocalpath':
          return function (localpath, callback) {
            var tmp = _.findIndex(eqftp.connections._tmp_downloaded, {params: {localpath: localpath}});
            if (tmp > -1) {
              callback(null, eqftp.connections._tmp_downloaded[tmp].connection.id);
              return eqftp.connections._tmp_downloaded[tmp].connection.id;
            } else {
              var deepest = 0,
                  сonn = '';
              _.forOwn(eqftp.connections._c_settings, function (connection, id) {
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
          };
          break;
      }
      if (action in obj._all) {
        //we have it in settings, action is id
        return (function (id) {
          var p = new Proxy(obj._all[id], {
            get: function (connection, act) {
              if (act in connection) {
                return connection[act];
              }
              switch (act) {
                case 'ls':
                case 'upload':
                case 'download':
                case 'pwd':
                  var d = function () {
                    var prepend = false;
                    if (['upload', 'download'].indexOf(act) < 0) {
                      // for everything except downloads and uploads
                      prepend = true;
                    }
                    var args = [...arguments],
                        callback = _.nth(args, -2),
                        progress = _.nth(args, -1),
                        qid = utils.uniq();
                    
                    // PRE-HOOKS
                    switch(act) {
                      case 'download':
                        args[0] = {
                          qid: qid,
                          remotepath: args[0],
                          localpath: eqftp.connections[id].resolveLocalpath(args[0])
                        };
                        break;
                      case 'upload':
                        args[0] = {
                          qid: qid,
                          localpath: args[0],
                          remotepath: eqftp.connections[id].resolveRemotepath(args[0])
                        };
                        break;
                    }
                    
                    eqftp.connections[id].queue.add({
                      qid: qid,
                      id: id,
                      act: act,
                      args: args,
                      queue: 'a'
                    }, prepend);
                  };
                  return function () {
                    var args = [...arguments];
                    if (!obj._current[id]) {
                      eqftp.connections[id].new(function (err, id) {
                        d(...args);
                      });
                    } else {
                      d(...args);
                    }
                  };
                  break;
                case 'queue':
                  return {
                    add: function (queuer, prepend) {
                      if (!obj._current[id]._queue) {
                        obj._current[id]._queue = [];
                      }
                      if (!queuer.qid) {
                        queuer.qid = utils.uniq();
                      }
                      if (prepend) {
                        obj._current[id]._queue.unshift(queuer);
                      } else {
                        obj._current[id]._queue.push(queuer);
                      }
                      _domainManager.emitEvent("eqFTP", "event", {
                        action: 'queue:update',
                        data: eqftp.queue.get()
                      });
                      eqftp.connections[id].queue.next();
                    },
                    next: function () {
                      if (obj._current[id]._queue && obj._current[id]._queue.length > 0) {
                        var f = _.findIndex(obj._current[id]._queue, {queue: 'a'});
                        if (f < 0) {
                          return false;
                        }
                        var queuer = (_.pullAt(obj._current[id]._queue, f))[0];
                        if (!obj._current[id].isBusy) {
                          obj._current[id].isBusy = true;
                        }
                        var args = queuer.args,
                            callback = _.nth(args, -2),
                            progress = _.nth(args, -1);
                        var cb = function (err, data) {
                          // POST-HOOKS
                          
                          switch(queuer.act) {
                            case 'ls':
                              if (!err) {
                                var path = args[0];
                                if (!/^\//.test(path)) {
                                  path = obj._current[queuer.id]._server.getRealRemotePath(path);
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
                                eqftp.connections._recently_downloaded = _.unionWith(eqftp.connections._recently_downloaded, [{
                                  id: id,
                                  localpath: args[0].localpath,
                                  remotepath: args[0].remotepath
                                }], function (a, b) {
                                  return (a.id === b.id && a.localpath === b.localpath);
                                });
                                if (obj._current[queuer.id].isTmp) {
                                  if (!eqftp.connections._tmp_downloaded) {
                                    eqftp.connections._tmp_downloaded = [];
                                  }
                                  eqftp.connections._tmp_downloaded.push({
                                    params: args[0],
                                    connection: obj._all[queuer.id]
                                  });
                                  if (!obj._all[id]._watch) {
                                    obj._all[id]._watch = chokidar.watch(args[0].localpath);
                                    obj._all[id]._watch
                                      .on('change', function (path) {
                                        console.log('change tmp', path, arguments);
                                      });
                                  } else {
                                    obj._all[id]._watch.add(args[0].localpath);
                                  }
                                }
                              }
                              break;
                          }
                          
                          obj._current[queuer.id].isBusy = false;
                          if (err) {
                            queuer.queue = 'f';
                            queuer.err = err;
                            eqftp.connections[queuer.id].queue.add(queuer, true);
                          }
                          
                          _domainManager.emitEvent("eqFTP", "event", {
                            action: 'queue:update',
                            data: eqftp.queue.get()
                          });
                          _domainManager.emitEvent("eqFTP", "event", {
                            action: 'connection:' + queuer.act,
                            data: queuer
                          });
                          callback(err, data);
                        };
                        var pr = function (err, data) {
                          progress(err, data);
                        };
                        
                        args.splice(-2, 2, cb, pr);
                        obj._current[queuer.id]._server[queuer.act](...args);
                      }
                    }
                  };
                  break;
                case 'new':
                  return function (cb) {
                    if (_.isFunction(cb)) {
                      cb = _.once(cb);
                    }
                    var connectionDetails = utils.parseConnectionString(id);
                    if (!connectionDetails) {
                      connectionDetails = connection;
                    }
                    if (obj._current[id]) {
                      cb(null, id);
                      return id;
                    }
                    obj._current[id] = _.cloneDeep(connectionDetails);
                    obj._current[id]._server = new EFTP();

                    obj._current[id]._server.on('ready', function () {
                      obj._current[id]._startpath = obj._current[id]._server.currentPath;
                      _domainManager.emitEvent("eqFTP", "event", {
                        action: 'connection:ready',
                        data: connectionDetails
                      });
                      cb(null, id);
                    });
                    obj._current[id]._server.on('close', function () {
                      _domainManager.emitEvent("eqFTP", "event", {
                        action: 'connection:close',
                        data: connectionDetails
                      });
                      cb('Forced connection closing');
                      _.unset(obj._current, id);
                    });
                    obj._current[id]._server.on('error', function (err) {
                      _domainManager.emitEvent("eqFTP", "event", {
                        action: 'connection:error',
                        data: {
                          connection: connectionDetails,
                          error: err
                        }
                      });
                      cb(err);
                      obj._current[id].close();
                    });
                    obj._current[id]._server.on('progress', function (data) {
                      _domainManager.emitEvent("eqFTP", "event", {
                        action: 'queue:progress',
                        data: data
                      });
                    });

                    var settings = {
                        host: connectionDetails.server,
                        type: connectionDetails.protocol,
                        port: connectionDetails.port || 21,
                        username: connectionDetails.login,
                        password: connectionDetails.password,
                        debugMode: true
                    };
                    if (connectionDetails.rsa) {
                        settings.privateKey = connectionDetails.rsa;
                    }
                    obj._current[id]._server.connect(settings);
                  }
                  break;
                case 'close':
                  return function (id) {
                    if (obj._current && obj._current[id] && obj._current[id]._server) {
                      if (obj._all[id]._watch) {
                        obj._all[id]._watch.close();
                      }
                      return obj._current[id]._server.close();
                    }
                    return true;
                  }
                  break;
                case 'resolveLocalpath':
                  return function (remotepath) {
                    var filename = remotepath.replace(RegExp("^" + (obj._current[id].remotepath || obj._current[id]._startpath || '')), '');
                    console.log('resolving localpath', filename, obj._current[id]._startpath);
                    if (obj._current[id].isTmp) {
                      var tmp = _.findIndex(eqftp.connections._tmp_downloaded, {params: {remotepath: remotepath}, connection: {id: id}});
                      if (tmp > -1) {
                        filename = utils.getNamepart(eqftp.connections._tmp_downloaded[tmp].params.localpath);
                      } else {
                        filename = id + '.' + utils.uniq() + '.' + utils.getNamepart(filename, 'filename');
                      }
                    }
                    return utils.normalize(obj._current[id].localpath + '/' + filename);
                  };
                  break;
                case 'resolveRemotepath':
                  return function (localpath) {
                    if (obj._current[id].isTmp) {
                      var tmp = _.findIndex(eqftp.connections._tmp_downloaded, {params: {localpath: localpath}, connection: {id: id}});
                      if (tmp > -1) {
                        return eqftp.connections._tmp_downloaded[tmp].params.remotepath;
                      }
                    }
                    return utils.normalize((obj._current[id].remotepath || obj._current[id]._startpath) + '/' + localpath.replace(RegExp("^" + (obj._current[id].localpath || '')), ''));
                  };
                  break;
              }
            }
          });
          return p;
        })(action);
      }
    }
  });

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
              passing = args,
              callback = _.nth(args, -2),
              progress = _.nth(args, -1);
          var f = _.get(eqftp.connections, path, false);
          if (!f) {
            callback(true, f);
          }
          if (_.isFunction(f)) {
            f(...passing);
          } else {
            callback(undefined, f);
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