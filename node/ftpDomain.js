/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*global */

(function () {
  "use strict";

  var EFTP = require('eftp'),
      safezone = require('domain').create(),
      fs = require('fs'),
      CryptoJS = require("../modules/crypto-js/crypto-js"),
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
  
  var eqftp = {};
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
          break;
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
      console.log('Shit', settingsFile, password);
      if (settingsFile) {
        settingsFile = utils.normalize(settingsFile);
        if (!fs.existsSync(settingsFile)) {
console.log('One');
          throw new Error('Passed file does not exists');
        }
        settingsFile = fs.realpathSync(settingsFile);
        self.settings = self._process(fs.readFileSync(settingsFile), 'fromJSON', password);
      }
      if (!self.settings) {
console.log('Two');
        throw new Error('No settings loaded');
      }

console.log('Three');
      return self.settings;
    };
  }();

  safezone.on('error', function (err) {
    /*eqftp.utils.event({
      action: 'error',
      text: 'Some error happened',
      errType: 'connections',
      error: err
    });
    eqftp.utils.event({
      action: 'debug',
      trace: {
        func: stackTrace.get()[0].getFunctionName(),
        filename: stackTrace.get()[0].getFileName(),
        line: stackTrace.get()[0].getLineNumber()
      },
      info: err
    });*/
  });

  function init(DomainManager) {
    if (!DomainManager.hasDomain("eqFTP")) {
      DomainManager.registerDomain("eqFTP", {major: 1, minor: 0});
    }
    _domainManager = DomainManager;

    DomainManager.registerCommand(
      "eqFTP",
      "settings.get",
      eqftp.settings.get,
      false
    );
    DomainManager.registerEvent(
      "eqFTP",
      "event"
    );
  }
  exports.init = init;
}());