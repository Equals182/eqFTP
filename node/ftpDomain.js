/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */
/*global */

(function () {
  "use strict";

  var EFTP = require('./libs/eftp'),
    utils = require('./libs/utils.js'),
    tracker = require('./libs/tracker.js'),
    fs = require('fs-extra'),
    CryptoJS = require("crypto-js"),
    chokidar = require('chokidar'),
    hashFiles = require('hash-files'),
    DiffMatchPatch = require('diff-match-patch'),
    os = require('os'),
    _ = require("lodash");

  var _domainManager;

  _.isJSON = function (input) {
    try { JSON.parse(input); } catch (e) { return false; }
    return true;
  };
  
  var _debugState = true;
  var debug = function () {
    if (_debugState === true) {
      console.log('[eqFTP node]', ...arguments);
    }
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
    self._version = '1.0.0';
    self.password = undefined;
    self.currentSettingsFile = false;
    self.settings = false;

    self.mutate = function (settings) {
      // TODO: Mutate settings file with lower version to newer
      return settings;
    };
    self._cc = function (act, source) {
      // cc - convert connections
      if (!source) {
        source = _.cloneDeep(self.settings.connections);
      }
      if (!_.isObject(source)) {
        return false;
      }
      switch (act) {
        case 'split':
          var cs = {}, cc = {};
          _.forOwn(source, function (connection, id) {
            _.set(cs, id, _.pick(connection, [
              'id',
              'name',
              'localpath',
              'remotepath',
              'check_difference',
              'autoupload',
              'ignore_list'
            ]));
            _.set(cc, id, _.pick(connection, [
              'protocol',
              'server',
              'port',
              'login',
              'rsa',
              'password'
            ]));
          });
          return {
            settings: cs,
            credentials: cc
          };
          break;
        case 'join':
        default:
          var c = {};
          _.forOwn(source.settings, function (connection, id) {
            _.set(c, id, _.merge(source.settings[id], (source.credentials[id] || {}), {id: id}));
          });
          return c;
          break;
      }
    };
    self.get = function (settingsFile, password) {
      //this function loads settings file or returns current loaded settings
      debug('eqftp.settings.get fired', settingsFile, password);
      
      if (settingsFile) {
        if (password === null) {
          password = undefined;
        }
        self.password = password;
        debug('self.password is now', self.password);
        
        settingsFile = utils.normalize(settingsFile);
        if (!fs.existsSync(settingsFile)) {
          throw new Error('FILENOTEXIST');
        }
        
        settingsFile = fs.realpathSync(settingsFile);
        self.settings = false;
        
        debug('reading settings file');
        var read = fs.readFileSync(settingsFile, {encoding: 'UTF-8'});
        if (!_.isJSON(read)) {
          throw new Error('NOTAJSON');
        }
        read = JSON.parse(read);
        if (!_.isObject(read) || !_.has(read, 'misc.version')) {
          throw new Error('NOTASETTINGSFILE');
        }
        debug('mutating settings file');
        read = self.mutate(read);
        self.settings = _.cloneDeep(read);
        debug('self.settings', self.settings);
        self.currentSettingsFile = settingsFile;
        _debugState = !!_.get(self.settings, 'main.debug');
        _.set(self.settings, 'misc.userId', tracker.init(_.get(self.settings, 'misc.userId'), {
          version: self.settings.misc.version
        }));
        debug('setting settings');
        self.set(self.settings, undefined, undefined, true);
        
        debug('joining connections objects', self.settings.connections);
        var joined = self.settings.connections;
        if (_.has(self.settings, 'connections') && _.has(self.settings, 'connections.settings')) {
          joined = self._cc('join', self.settings.connections);
        }
        debug('joined', joined);
        
        debug('is encrypted?', self.settings.misc.encrypted);
        if (self.settings.misc.encrypted === true) {
          if (!self.password) {
            self.settings.connections = joined;
            eqftp.connections._set(self.settings.connections);
            throw new Error('NEEDPASSWORD');
          }
          debug('decrypting', self.settings.connections.credentials);
          self.settings.connections.credentials = AES.decrypt(self.settings.connections.credentials, password);
          debug('decrypted', self.settings.connections.credentials);
          if (_.isJSON(self.settings.connections.credentials)) {
            self.settings.connections.credentials = JSON.parse(self.settings.connections.credentials);
            debug('joining connections objects2', self.settings.connections);
            if (_.has(self.settings, 'connections') && _.has(self.settings, 'connections.settings')) {
              joined = self._cc('join', self.settings.connections);
            }
            debug('joined2', joined);
          } else {
            throw new Error('DECRYPTEDNOTAJSON');
          }
        }
        self.settings.connections = joined;
        debug('self.settings.connections', self.settings.connections);
        debug('firing eqftp.connections._set');
        eqftp.connections._set(self.settings.connections);
      }
      
      if (!self.settings) {
        debug('No settings set');
        throw new Error('NOSETTINGS');
      }
      
      debug('self.settings final get', self.settings);
      return self.settings;
    };
    self.set = function (settings, password, path, silent) {
      debug('eqftp.settings.set fired', settings, password, path, silent);
      
      if (_.has(settings, 'connections') && _.has(settings, 'connections.settings')) {
        settings.connections = self._cc('join', settings.connections);
      }
      
      var toSaveNew = _.cloneDeep(settings);
      if (_.has(settings, 'connections') && !_.has(settings, 'connections.settings')) {
        toSaveNew.connections = self._cc('split', toSaveNew.connections);
        debug('splitted', toSaveNew.connections);
      }
      
      var toSaveCurrent = _.cloneDeep(self.settings);
      if (_.has(toSaveCurrent, 'connections') && !_.has(toSaveCurrent, 'connections.settings')) {
        toSaveCurrent.connections = self._cc('split', toSaveCurrent.connections);
        debug('splitted2', toSaveCurrent.connections);
      }
      
      var defaults = {
        main: {
          projects_folder: (path ? utils.normalize(utils.getNamepart(path, 'parentPath') + '/eqftp') : utils.normalize(os.homedir() + '/eqftp')),
          date_format: "d.m.Y",
          debug: false,
          open_project_connection: false
        },
        misc: {
          version: self._version,
          encrypted: false
        }
      };
      
      var toSave = _.defaultsDeep({
        misc: {
          version: self._version
        }
      }, toSaveNew, toSaveCurrent, defaults, {
        connections: {
          settings: {},
          credentials: {}
        }
      });
      debug('toSave', toSave);
      var toKeep = _.defaultsDeep({
        misc: {
          version: self._version
        }
      }, settings, self.settings, defaults, {
        connections: {}
      });
      debug('toKeep is now', toKeep);
      
      [
        'settings_file',
        'master_password'
      ].forEach(function (v) {
        _.unset(toKeep, v);
        _.unset(toSave, v);
      });
      
      _debugState = !!_.get(toSave, 'main.debug');
      var settingsFile = utils.normalize((path || self.currentSettingsFile));
      debug('settingsFile', settingsFile);
      if (!settingsFile) {
        debug('no settingsFile');
        throw new Error('NOSETTINGSPATHPASSED');
      }
      /*
      if (!fs.existsSync(settingsFile)) {
        throw new Error('Passed file does not exists');
      }
      */
      settingsFile = utils.normalize(settingsFile);
      if (_.get(toSave, 'misc.encrypted') === true) {
        debug('needs encryption');
        if (!password) {
          password = self.password;
        }
        debug('password', password);
        if (!password) {
          throw new Error('NEEDPASSWORD');
        }
        self.password = password;
        /*if (_.isObject(settings.connections.credentials)) {
          settings.connections.credentials = JSON.stringify(settings.connections.credentials);
        }*/
        debug('credentials', toSave.connections.credentials);
        toSave.connections.credentials = AES.encrypt(toSave.connections.credentials, password);
      }
      debug('firing fs.writeFile');
      fs.writeFile(settingsFile, JSON.stringify(toSave, null, 4), {encoding: 'UTF-8'}, function (err, data) {
        debug('writeFile callback', err, data);
        if (err) {
          if (!silent) {
            _domainManager.emitEvent("eqFTP", "event", {
              action: 'settings:save:fail',
              data: {
                file: utils.normalize(settingsFile),
                err: err
              }
            });
          }
        } else {
          self.settings = toKeep;
          debug('self.settings is now', self.settings);
          if (!silent) {
            _domainManager.emitEvent("eqFTP", "event", {
              action: 'settings:save:success',
              data: {
                file: utils.normalize(settingsFile),
                data: data,
                settings: self.settings
              }
            });
          }
        }
      });
      return self.settings;
    };
    self.setConnection = function (connection) {
      debug('eqftp.settings.setConnection fired', connection);
      debug('self.settings', self.settings);
      var uniq = utils.uniq();
      var defaults = {
        protocol: 'ftp',
        port: 21,
        autoupload: true,
        check_difference: true,
        name: uniq,
        localpath: utils.normalize(eqftp.settings.get().main.projects_folder + '/' + (connection.name || uniq)),
        ignore_list: '',
        rsa: ''
      };
      debug('defaults', defaults);
      connection = _.omitBy(connection, _.isUndefined);
      if (!connection.localpath) {
        _.unset(connection, 'localpath');
      }
      debug('cleared connection', connection);
      if (!_.isObject(connection)) {
        throw new Error('NOTANOBJECT');
      }
      if (!connection.server) {
        throw new Error('NOSERVERSET');
      }
      debug('connection.id is', connection.id);
      if (!connection.id) {
        connection.id = utils.uniq();
        connection = _.defaultsDeep(connection, defaults);
      } else {
        var _c = _.get(eqftp, ['connections', 'a', connection.id]);
        if (!_c) {
          throw new Error('CONNECTIONIDNOTEXIST');
        } else {
          _c = _.omitBy(_c, _.isEmpty);
        }
        connection = _.defaultsDeep(connection, _c, defaults);
      }
      debug('connection is a connection object?', _.isConnection(connection));
      if (!_.isConnection(connection)) {
        throw new Error('NOTACONNECTIONOBJECT');
      }
      debug('current settings', self.settings);
      debug('is connection\'s localpath different from what it was?', connection, self.settings.connections[connection.id]);
      if (connection.localpath !== _.get(self.settings, ['connections', connection.id, 'localpath']) && _.has(eqftp, ['connections', '_', connection.id, '_watch'])) {
        debug('stopping watchers', eqftp.connections._[connection.id]._watch);
        if (eqftp.connections._[connection.id]._watch) {
          eqftp.connections._[connection.id]._watch.close();
        }
        eqftp.connections._[connection.id]._watch = undefined;
      }
      debug('final connection object', connection);
      eqftp.connections._set(connection.id, connection);
      self.settings.connections[connection.id] = connection;
      debug('eqftp.settings.settings', self.settings);
      
      debug('do we have file to save settings to?', self.currentSettingsFile);
      if (self.currentSettingsFile) {
        self.set(self.settings, self.password, self.currentSettingsFile);
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
    }, 500, {
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
      debug('eqftp.connections._set fired');
      if (_.isUndefined(settings) && _.isObject(id)) {
        debug('bulk resetting');
        // bulk resetting
        _.forOwn(self._, function (c, id) {
          if (_.get(self, ['_', id, '_watch'])) {
            self._[id]._watch.close();
          }
          c.close();
        });
        self._ = {};
        self.$ = {};
        _.forOwn(id, function (c, id) {
          self._set(id, c);
        });
      } else {
        debug('setting by one', id, settings);
        // setting by one
        if (self._[id]) {
          debug('closing existing connection', id);
          if (_.get(self, ['_', id, '_watch'])) {
            self._[id]._watch.close();
          }
          self._[id].close();
        }
        if (!settings) {
          debug('getting connections by id', id);
          settings = _.get(eqftp.settings.get(), ['connections', id]);
          if (!settings) {
            return false;
          }
        }
        self.$[id] = _.cloneDeep(settings);
        debug('self.$', self.$[id]);
        self.a = _.defaultsDeep(self.$, self.t);
        debug('self.a', self.a[id]);
        self._[id] = new Proxy(
          _.defaultsDeep(_.cloneDeep(settings), {
            _watch: function () {
              if (!settings.isTmp && settings.localpath && fs.existsSync(settings.localpath)) {
                var w = chokidar.watch(settings.localpath, {
                  ignored: (settings.ignore_list || '').splitIgnores(),
                  persistent: true,
                  awaitWriteFinish: {
                    stabilityThreshold: 1000,
                    pollInterval: 100
                  },
                  cwd: settings.localpath,
                  ignoreInitial: true
                });
                debug('[watcher]', 'initialized', settings.localpath);
                w.on('add', function (path, stats) {
                  path = utils.normalize(path);
                  debug('[watcher]', 'add', path, stats);
                })
                .on('change', function (path, stats) {
                  debug('[watcher]', 'change', path, stats);
                  path = utils.normalize(path);
                  if (!/^\//.test(path)) {
                    path = utils.normalize(settings.localpath + '/' + path);
                  }
                  debug('eqftp.cache._recently_downloaded', eqftp.cache._recently_downloaded);
                  if (!eqftp.cache._recently_downloaded) {
                    eqftp.cache._recently_downloaded = [];
                  }
                  var rd = _.findIndex(eqftp.cache._recently_downloaded, {id: id, localpath: path});
                  debug('rd', rd);
                  if (rd > -1) {
                    eqftp.cache._recently_downloaded.splice(rd, 1);
                    return false;
                  }
                  debug('settings.autoupload', settings.autoupload);
                  if (settings.autoupload) {
                    eqftp.connections._[id].upload(path, function () {}, function () {});
                  }
                })
                .on('unlink', function (path, stats) {
                  path = utils.normalize(path);
                  debug('[watcher]', 'unlink', path, stats);
                })
                .on('addDir', function (path) {
                  debug('[watcher]', 'addDir', path);
                })
                .on('unlinkDir',  function (path) {
                  debug('[watcher]', 'unlinkDir', path);
                })
                .on('error',  function (error) {
                  debug('[watcher]', 'error', error);
                })
                .on('ready',  function () {
                  debug('[watcher]', 'ready!');
                })
                .on('raw', (event, path, details) => {
                  debug('[watcher]', 'RAW', event, path, details);
                });
                return w;
              }
              return undefined;
            }(),
            _queue: [],
            queue: new function () {
              var queue = this;
              queue.accept = true;
              queue.q = [];
              queue.isBusy = false;
              
              queue.clear = function () {
                queue.q = [];
                queue.isBusy = false;
                return queue.q;
              };
              queue.reset = function (accept) {
                queue.q = [];
                queue.isBusy = false;
                queue.accept = !!accept;
                _domainManager.emitEvent("eqFTP", "event", {
                  action: 'queue:update',
                  data: eqftp.queue.get()
                });
              };
              queue.get = function () {
                return queue.q;
              };
              queue.add = function (queuer, prepend) {
                if (!queue.accept) {
                  return false;
                }
                
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
                _.set(eqftp.cache, ['queue', id], queue.q);
                debug('eqftp.cache.queue', id, eqftp.cache.queue[id]);
                
                _domainManager.emitEvent("eqFTP", "event", {
                  action: 'queue:update',
                  data: eqftp.queue.get()
                });
                
                queue.next();
              };
              queue.next = function () {
                debug('checking if password was entered');
                var settings = eqftp.settings.get();
                if (_.has(settings, 'misc.encrypted') &&
                  (
                    (!!_.get(settings, 'misc.encrypted')) === true &&
                    !eqftp.settings.password
                  ) ||
                  (
                    !_.has(eqftp.connections, ['_', id, 'server']) ||
                    !_.has(eqftp.connections, ['_', id, 'login'])
                  )
                ) {
                  debug('forcing password prompt');
                  // Not decrypted yet, don't start queue
                  _domainManager.emitEvent("eqFTP", "event", {
                    action: 'settings:forcedneedpassword',
                    data: ['connections', id, 'queue.next']
                  });
                  return false;
                }
                debug('cached queue', _.has(eqftp.cache, ['queue', id]), eqftp.cache.queue[id]);
                if (!_.has(eqftp.cache, ['queue', id])) {
                  _.set(eqftp.cache, ['queue', id], []);
                }
                queue.q = eqftp.cache.queue[id];
                debug('our queue', queue.q);
                if (queue.q && queue.q.length > 0) {
                  var f = _.findIndex(queue.q, {queue: 'a'});
                  debug('do we have any a\'s?', f);
                  if (f < 0) {
                    return false;
                  }
                  debug('are we busy?', queue.isBusy);
                  if (!queue.isBusy) {
                    queue.isBusy = true;
                  } else {
                    // not going anywhere were busy
                    return false;
                  }
                  var queuer = _.nth(queue.q, f),
                      args = queuer.args,
                      callback = _.nth(args, -2),
                      progress = _.nth(args, -1);

                  var finisher = function (err, data) {
                    debug('firing finisher');
                    var i = _.findIndex(queue.q, {qid: queuer.qid});
                    if (i > -1) {
                      queuer = (_.pullAt(queue.q, i))[0];
                      _.set(eqftp.cache, ['queue', id], queue.q);
                      if (err) {
                        queuer.queue = 'f';
                        queuer.err = err;
                        queue.add(queuer, true);
                      }
                    }
                    queue.isBusy = false;
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
                    debug('firing callback', err, data);
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
                          debug('eqftp.cache._recently_downloaded', eqftp.cache._recently_downloaded);
                          if (self._[id].isTmp) {
                            if (!eqftp.cache._tmp_downloaded) {
                              eqftp.cache._tmp_downloaded = [];
                            }
                            eqftp.cache._tmp_downloaded.push({
                              params: args[0],
                              connection: self.a[id]
                            });
                            if (!self._[id]._watch && fs.existsSync(args[0].localpath)) {
                              var w = chokidar.watch(args[0].localpath, {
                                ignoreInitial: true,
                                awaitWriteFinish: {
                                  stabilityThreshold: 1000,
                                  pollInterval: 100
                                }
                              });
                              w
                              .on('change', function (path) {
                                debug('[watcher-tmp]', 'change', path);
                              })
                              .on('error',  function (error) {
                                debug('[watcher-tmp]', 'error', error);
                              })
                              .on('ready',  function () {
                                debug('[watcher-tmp]', 'ready!');
                              })
                              .on('raw', (event, path, details) => {
                                debug('[watcher-tmp]', 'RAW', event, path, details);
                              });
                              self._[id]._watch = w;
                            } else {
                              self._[id]._watch.add(args[0].localpath);
                            }
                          }
                        }
                        break;
                      case 'upload':
                        break;
                    }
                    if (queuer.callback && _.isFunction(queuer.callback)) {
                      queuer.callback();
                    }

                    if (err) {
                      queuer.queue = 'f';
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
                  debug('opening connection', id);
                  self._[id].open(function (err) {
                    debug('opening connection result', err);
                    if (!err) {
                      if (queuer.act) {
                        switch (queuer.act) {
                          case 'upload':
                          case 'download':
                            if (!queuer._skipDiffcheck) {
                              var _queuer = _.defaults(queuer, {id: id});
                              eqftp.comparator.compare(_queuer, function (result) {
                                debug('comparator result', result);
                                if (_.isString(result)) {
                                  console.warn(result);
                                  debug('queue.q, queuer', queue.q, queuer);
                                  switch (result) {
                                    case 'difference_upload':
                                      queue.add(_.defaultsDeep({
                                        qid: null,
                                        act: 'upload',
                                        _skipDiffcheck: true,
                                        callback: function () {
                                          if (_.get(self.a, [id, 'check_difference'])) {
                                            debug('saving hash for queuer 1', queuer);
                                            eqftp.comparator.saveHash(queuer);
                                          }
                                        }
                                      }, queuer), true);
                                      eqftp.comparator.deleteTmp(_queuer);
                                      break;
                                    case 'difference_download':
                                      queue.add(_.defaultsDeep({
                                        qid: null,
                                        act: 'download',
                                        _skipDiffcheck: true,
                                        callback: function () {
                                          if (_.get(self.a, [id, 'check_difference'])) {
                                            debug('saving hash for queuer 2', queuer);
                                            eqftp.comparator.saveHash(queuer);
                                          }
                                        }
                                      }, queuer), true);
                                      eqftp.comparator.deleteTmp(_queuer);
                                      break;
                                    case 'skip':
                                      eqftp.comparator.deleteTmp(_queuer);
                                      break;
                                  }
                                  debug('queue.q, queuer', queue.q, queuer);
                                  finisher(null, result);
                                } else if (result) {
                                  queuer.callback = function () {
                                    if (_.get(self.a, [id, 'check_difference'])) {
                                      debug('saving hash for queuer 3', queuer);
                                      eqftp.comparator.saveHash(queuer);
                                    }
                                  };
                                  self._[id]._server[queuer.act](...args);
                                }
                              });
                            } else {
                              self._[id]._server[queuer.act](...args);
                            }
                            break;
                          default:
                            self._[id]._server[queuer.act](...args);
                            break;
                        }
                      } else {
                        debug('no queuer.act');
                        finisher(new Error('No queuer.act'));
                      }
                    } else {
                      debug('running finisher');
                      finisher(err);
                    }
                  });
                }
              };
              queue.restart = function (qid) {
                var f = _.findIndex(queue.q, ['qid', qid]);
                if (f > -1 && queue.accept) {
                  queue.q[f].queue = 'a';
                  _domainManager.emitEvent("eqFTP", "event", {
                    action: 'queue:update',
                    data: eqftp.queue.get()
                  });
                  queue.next();
                }
              };
              queue.remove = function (qid) {
                var f = _.findIndex(queue.q, ['qid', qid]);
                if (f > -1) {
                  _.pullAt(queue.q, f);
                  _domainManager.emitEvent("eqFTP", "event", {
                    action: 'queue:update',
                    data: eqftp.queue.get()
                  });
                }
              };
            }(),
            open: function (cb) {
              debug('eqftp.connections[id].open fired', id, cb);
              if (_.isFunction(cb)) {
                cb = _.once(cb);
              }
              debug('do we have _server?', !!self._[id]._server);
              if (self._[id]._server) {
                cb(null, id);
                return true;
              }

              debug('my donor', self.a, self.a[id]);
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
              
              debug('settings', settings);
              if (
                !settings.host ||
                !settings.username
              ) {
                cb(new Error('NOHOSTORUSERNAMESET'));
                return false;
              }

              self._[id]._server = new EFTP();

              self._[id]._server.on('ready', function () {
                self._[id]._startpath = self._[id]._server.currentPath;
                _domainManager.emitEvent("eqFTP", "event", {
                  action: 'connection:ready',
                  data: self.a[id]
                });
                debug('connected to server, firing callback', cb.toString());
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

              debug('connecting', settings)
              self._[id]._server.connect(settings);
            },
            remove: function () {
              self._[id].queue.reset();
              self._[id].close();
              _.unset(self, ['_', id]);
              _.unset(self, ['$', id]);
              _.unset(self, ['a', id]);
              _.unset(self, ['t', id]);
              self.event_update();
              _.unset(eqftp, ['settings', 'settings', 'connections', id]);
              eqftp.settings.set(eqftp.settings.get());
            },
            close: function () {
              if (self._[id]) {
                if (self._[id]._server) {
                  self._[id]._server.close();
                  _.unset(self._[id], '_server');
                }
              }
              return true;
            },
            resolveLocalpath: function (remotepath) {
              debug('resolveLocalpath fired');
              debug('replacing remotepath or startpath', self._[id].remotepath, self._[id]._startpath);
              var r = RegExp("^" + (utils.normalize('/' + (self._[id].remotepath || self._[id]._startpath || ''))));
              debug('regex is', r);
              var filename = remotepath.replace(r, '');
              debug('remotepath is now', remotepath, filename);
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
              var startpath = (self._[id].remotepath || self._[id]._startpath || '');
              return utils.normalize((startpath ? (startpath + '/') : '') + localpath.replace(RegExp("^" + (self._[id].localpath || '')), ''));
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

                  var queuer = {
                    qid: qid,
                    id: id,
                    act: method,
                    args: args,
                    queue: 'a'
                  };
                  debug('adding to queue', queuer, prepend);
                  self._[id].queue.add(queuer, prepend);
                };
                break;
            }
          }
        });
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
      debug('eqftp._getByLocalpath fired');
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
    },
    clear: function () {
      _.forOwn(eqftp.connections._get(), function (c, id) {
        c.queue.clear();
      });
      _domainManager.emitEvent("eqFTP", "event", {
        action: 'queue:update',
        data: eqftp.queue.get()
      });
      return true;
    },
    restart: function (qid) {
      _.forOwn(eqftp.connections._get(), function (c, id) {
        c.queue.restart(qid);
      });
    },
    remove: function (qid) {
      _.forOwn(eqftp.connections._get(), function (c, id) {
        c.queue.remove(qid);
      });
    }
  };
  eqftp.comparator = new function () {
    var self = this;
    
    self._callbacks = {};
    self.resolve = function (qid, action) {
      var queue = eqftp.queue.get(),
          _queuer = _.find(queue, {qid: qid});
      if (!_queuer) {
        return false;
      }
      debug('resolving', qid, action, _queuer);

      if (action) {
        switch (action) {
          case 'difference_show_diff':
            var text1 = fs.readFileSync(eqftp.comparator._pathTmp(_queuer), 'utf8'), // synced
                text2 = fs.readFileSync(_queuer.args[0].localpath, 'utf8'); // local
            var dmp = new DiffMatchPatch(),
                diffs = dmp.diff_main(text1, text2);
            dmp.diff_cleanupSemantic(diffs);

            var patch = dmp.patch_toText(dmp.patch_make(diffs));
            patch = patch.replace(/%0D%0A/g, "%0A");
            patch = patch.replace(/\%0\A/g, "");
            patch = patch.replace(/^(\-.*)$/gm, '<del>$1</del>');
            patch = patch.replace(/^(\+.*)$/gm, '<ins>$1</ins>');
            _domainManager.emitEvent("eqFTP", "event", {
              action: 'comparator:diffview',
              data: {
                diff: dmp.diff_prettyHtml(diffs),
                patch: patch
              }
            });
            break;
          case 'difference_open_both':
            var ext = utils.getNamepart(_queuer.args[0].localpath, 'extension');
            _domainManager.emitEvent("eqFTP", "event", {
              action: 'comparator:splitview',
              data: {
                pane1: {
                  file: _queuer.args[0].localpath,
                  extension: ext
                },
                pane2: {
                  file: eqftp.comparator._pathTmp(_queuer),
                  extension: ext
                }
              }
            });
            break;
          default:
            if (_.has(self._callbacks, qid)) {
              debug('have one, firing');
              self._callbacks[qid](action);
            }
            break;
        }
      }
    };
    self._pathHash = function (queuer) {
      return utils.normalize(eqftp.connections.a[queuer.id].localpath + '/.eqftp/' + queuer.args[0].remotepath + '.hash.eqftp');
    };
    self._pathTmp = function (queuer) {
      return utils.normalize(eqftp.connections.a[queuer.id].localpath + '/.eqftp/' + queuer.args[0].remotepath + '.tmp.eqftp');
    };
    self.saveHash = function (queuer) {
      debug('saveHash fired', queuer);
      if (!_.has(queuer, 'id') || !_.has(queuer, ['args', '0', 'remotepath']) || !_.has(queuer, ['args', '0', 'localpath'])) {
        return false;
      }
      try {
        var hashFile = self._pathHash(queuer);
        if (fs.existsSync(queuer.args[0].localpath)) {
          debug('calculating hash', queuer.args[0].localpath);
          var hash = hashFiles.sync({
            files: queuer.args[0].localpath,
            algorithm: 'sha512'
          });
          debug('hash', hash);
          debug('writing hash to', hashFile);
          var parent = utils.getNamepart(hashFile, 'parentPath');
          debug('checking parent', parent);
          if (!fs.existsSync(parent)) {
            debug('creating parent', parent);
            fs.mkdirsSync(parent);
          }
          fs.writeFileSync(hashFile, hash, {encoding: 'UTF-8'});
          return hash;
        }
        return false;
      } catch (e) {
        console.error(e);
        return false;
      }
    };
    self.deleteTmp = function (queuer) {
      debug('deleteTmp fired', queuer);
      if (!_.has(queuer, 'id') || !_.has(queuer, ['args', '0', 'remotepath'])) {
        return false;
      }
      try {
        var tmpFile = self._pathTmp(queuer);
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
        return false;
      } catch (e) {
        console.error(e);
        return false;
      }
    };
    self.compare = function (queuer, callback) {
      debug('eqftp.comparator.compare fired', queuer, callback.toString());
      if (!callback) {
        callback = function () {};
      }
      callback = _.once(callback);
      
      if (
        !_.has(eqftp, ['connections', 'a', queuer.id]) ||
        !_.get(eqftp, ['connections','a', queuer.id, 'check_difference']) ||
        !_.has(queuer, 'id') ||
        !_.has(queuer, ['args', '0', 'remotepath']) ||
        !_.has(queuer, ['args', '0', 'localpath'])
      ) {
        return callback(true);
      }
      
      try {
        var hashFile = self._pathHash(queuer),
            tmpFile = self._pathTmp(queuer),
            hash = false;
        debug('hashFile', hashFile);
        debug('tmpFile', tmpFile);
        if (!fs.existsSync(hashFile)) {
          debug('no hashFile found');
          if (!fs.existsSync(queuer.args[0].localpath)) {
            debug('no queuer.args[0].localpath found, new file, callback(true)');
            return callback(true);
          }
          hash = self.saveHash(queuer);
        }
        debug('do we have hash?', hash);
        if (!hash) {
          debug('no, reading from', hashFile);
          hash = fs.readFileSync(hashFile, 'utf8');
        }
        debug('yes', hash);

        var nqid = (utils.uniq() + '-' + _.uniqueId());
        var nqueuer = _.defaultsDeep({qid: nqid, args: [{localpath: tmpFile, qid: nqid}]}, queuer);
        debug('nqueuer', nqueuer);
        debug('downloading tmp file for comparing', nqueuer);

        eqftp.connections._[queuer.id]._server.download(nqueuer.args[0], function (err, data) {
          debug('downloading result', err, data);
          if (!err) {
            debug('calculating hash', nqueuer.args[0].localpath);
            var tmphash = hashFiles.sync({
              files: nqueuer.args[0].localpath,
              algorithm: 'sha512'
            });
            debug('comparing hashes: ', tmphash, hash);
            debug('same?', (tmphash === hash));
            if (tmphash !== hash) {
              debug('HASHES ARE DIFFERENT', tmphash, hash);
              _.set(self._callbacks, queuer.qid, _.once(function (action) {
                callback(action);
                _.unset(self._callbacks, queuer.qid);
              }));
              
              _domainManager.emitEvent("eqFTP", "event", {
                action: 'comparator:difference',
                data: queuer
              });
              return true;
            } else {
              callback(true);
            }
          }
        });
      } catch (e) {
        console.error(e);
        callback(true);
      }
    }
  }();

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
        command: "comparator.resolve",
        async: true,
        description: 'Resolve comparator conflict by qid',
        parameters: [
          { name: "qid", type: "string", description: "Queuer id (qid)." },
          { name: "action", type: "string", description: "Compatible action for resolving. Take care of those actions by yourself." }
        ],
        returns: [
          { name: "success", type: "boolean", description: "TRUE if everything's okay and FALSE if error occured" }
        ]
      },
      {
        command: "queue.clear",
        async: false,
        description: 'Clears every queue except currently processed files',
        parameters: [],
        returns: [
          { name: "success", type: "boolean", description: "TRUE if everything's okay and FALSE if error occured" }
        ]
      },
      {
        command: "queue.restart",
        async: false,
        description: 'Restarts by qid',
        parameters: [
          { name: "qid", type: "string", description: "Should be a valid qid, not id" }
        ],
        returns: []
      },
      {
        command: "queue.remove",
        async: false,
        description: 'Removes by qid',
        parameters: [
          { name: "qid", type: "string", description: "Should be a valid qid, not id" }
        ],
        returns: []
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
        command: "_connections",
        async: true,
        description: 'Connects to server via id or credentials',
        parameters: [
          { name: "id", type: "string", description: "Connecion id or ftp credentials." }
        ],
        returns: [],
        cmd: function () {
          debug('called from outside', arguments);
          var args = [...arguments],
              path = args.shift(),
              cb = _.nth(args, -2),
              pr = _.nth(args, -1);
          if (path < 1) {
            var all = eqftp.connections._get();
            debug('returning', all);
            if (_.isFunction(cb)) {
              cb(null, all);
            }
            return all;
          } else {
            debug('checking eqftp.connections._get', path[0]);
            if (eqftp.connections._get(path[0])) {
              debug('we have it');
              // we have such connection
              debug('getting', eqftp.connections._get(path[0]), _.tail(path));
              var f = _.get(eqftp.connections._get(path[0]), _.tail(path));
              debug('got', f.toString(), args);
              if (f) {
                f(...args);
                return true;
              }
            } else {
              debug('we DONT have it');
              var f = _.get(eqftp.connections, path);
              debug('got2', f.toString());
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