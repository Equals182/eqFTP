/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */
/*global */

(function () {
  "use strict";

  var EFTP = require('eftp'),
    fs = require('fs'),
    CryptoJS = require("crypto-js"),
    utils = require('../modules/utils.js'),
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
        eqftp.connections._connections = self.settings.connections;
      }
      if (!self.settings) {
        throw new Error('No settings loaded');
      }
      return self.settings;
    };
  }();
  eqftp.connections = new function () {
    var self = this;
    self._current = {};
    self._connections = {};
    
    self.get = function (id) {
      return self._current[id];
    };
    self._unset = function (id) {
      if (self._current[id] && self._current[id].interval) {
        clearInterval(self._current[id].interval);
      }
      return _.unset(self._current, id);
    };
    self._set = function (id, params) {
      return _.set(self._current, id, params);
    };
    self.new = function (id) {
      var cb = _.once(arguments['1']),
          pr = arguments['2'],
          
          connectionDetails = utils.parseConnectionString(id);
      if (!connectionDetails) {
        connectionDetails = self._connections[id];
      }
      if (self._current[id]) {
        cb(null, id);
        return id;
      }
      self._current[id] = new function () {
          this.server = new EFTP();
      }();

      self._current[id].server.on('ready', function () {
        cb(null, id);
      });
      self._current[id].server.on('close', function () {
        _domainManager.emitEvent("eqFTP", "event", {
          action: 'connection:close',
          data: {id: id}
        });
        cb('Forced connection closing');
        eqftp.connection._destroy(id);
      });
      self._current[id].server.on('error', function (err) {
        _domainManager.emitEvent("eqFTP", "event", {
          action: 'connection:error',
          data: {
            id: id,
            error: err
          }
        });
        cb(err);
        eqftp.connection._destroy(id);
      });
      self._current[id].server.on('progress', function (data) {
        _domainManager.emitEvent("eqFTP", "event", {
          action: 'connection:progress',
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
      self._current[id].server.connect(settings);
    };
    self.action = function (id, action, params) {
      var cb = _.once(arguments['3']),
          pr = arguments['4'],
          connection = self.get(id);
      if (!connection) {
        self.new(id, function (err, data) {
          if (err) {
            cb(err);
            return err;
          }
          self.action(id, action, params, cb);
        });
        return;
      }
      console.log('TEST!!!', id, action, params);
    };
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
        command: "connections.new",
        async: true,
        description: 'Connects to server via id or credentials',
        parameters: [
          { name: "id", type: "string", description: "Connecion id or ftp credentials." }
        ],
        returns: []
      },
      {
        command: "connections.action",
        async: true,
        description: 'Fires an ftp action for connection',
        parameters: [
          { name: "id", type: "string", description: "Connecion id or ftp credentials." },
          { name: "action", type: "string", description: "FTP action (ls, upload, download)." },
          { name: "params", type: "object", description: "Parameters object." }
        ],
        returns: []
      }
    ].forEach(function (c) {
      var cmd = _.get(eqftp, c.command);
      if (!cmd) {
        return;
      }
      DomainManager.registerCommand(
        "eqFTP",
        c.command,
        cmd,
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