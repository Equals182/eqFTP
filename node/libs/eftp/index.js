/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */

"use strict";

var util = require('util'),
  EventEmitter = require('events').EventEmitter,
  fs = require('fs'),
  FTPClient = require('jsftp'),
  SSHClient = require('ssh2').Client,
  FileUtil = require('./lib/FileUtil'),
  utils = require('./../utils'),
  _ = require('lodash'),
  semver = require('semver');

var once = require('once'),
  NOOP = function () { },
  _fix_version = false;

var debug = function () {
  console.log('[eftp]', ...arguments);
};
debug('Node: ', process.version);
var v = process.version.replace(/^[^d]/, '');
[
  '0.10.30',
  '6.3.2'
].forEach(function (t) {
  if (semver.ltr(v, t)) {
    _fix_version = t;
  }
});

function EFTP() {
  if (!this instanceof EFTP) { throw "must 'new EFTP()'"; }
  EventEmitter.call(this);
}
util.inherits(EFTP, EventEmitter);

var _progressEvent = function () {};

FTPClient.prototype.setEmitProgress = function (queuer) {
  FTPClient.prototype.emitProgress = function (data) {
    _progressEvent({
      queuer: queuer,
      filename: data.filename,
      action: data.action,
      total: data.totalSize || (data.queuer ? data.queuer.size : undefined) || queuer.size || 0,
      transferred: data.socket[data.action === 'get' ? 'bytesRead' : 'bytesWritten']
    });
  };
};
/**
 * Depending on the number of parameters, returns the content of the specified
 * file or directly saves a file into the specified destination. In the latter
 * case, an optional callback can be provided, which will receive the error in
 * case the operation was not successful.
 *
 * @param {String} remotepath File to be retrieved from the FTP server
 * @param {Function|String} localpath Local path where we create the new file
 * @param {Function} [callback] Gets called on either success or failure
 */
FTPClient.prototype._get = function (queuer, callback) {
  var self = this;
  var finalCallback;

  FTPClient.prototype.setEmitProgress(queuer);
  if (typeof queuer.localpath === 'function') {
    finalCallback = once(queuer.localpath || NOOP);
  } else {
    callback = once(callback || NOOP);
    finalCallback = function (err, socket) {
      if (err) {
        return callback(err);
      }

      var writeStream = fs.createWriteStream(queuer.localpath);
      writeStream.on('error', callback);

      if (_fix_version === '0.10.30') {
        socket.on('readable', function () {
          FTPClient.prototype.emitProgress({
            queuer: queuer,
            action: 'get',
            socket: socket
          });
        });
      }

      // This ensures that any expected outcome is handled. There is no
      // danger of the callback being executed several times, because it is
      // wrapped in `once`.
      socket.on('error', callback);
      socket.on('end', callback);
      socket.on('close', callback);

      if (_fix_version === '6.3.2') {
        socket.on('data', function(data) {
          FTPClient.prototype.emitProgress({
            queuer: queuer,
            action: 'get',
            socket: socket
          });
        }).pipe(writeStream);
      }
      if (_fix_version === '0.10.30') {
        socket.pipe(writeStream);
        socket.resume();
      }
    };
  }

  this.getGetSocket(queuer.remotepath, finalCallback);
};

FTPClient.prototype._put = function (queuer, callback) {
  FTPClient.prototype.setEmitProgress(queuer);
  var self = this,
      from = queuer.localpath,
      to = queuer.remotepath;

  function putReadable(from, to, totalSize, callback, bs) {
    var transferred = 0;
    from.on('readable', function() {
      transferred += (bs || 0);
      if (transferred) {
        from.bytesWritten = transferred * 22;
      }
      self.emitProgress({
        filename: to,
        action: 'put',
        socket: from,
        totalSize: totalSize
      });
    });

    self.getPutSocket(to, function(err, socket) {
      if (!err) {
        from.pipe(socket);
      }
    }, callback);
  }

  if (from instanceof Buffer) {
    this.getPutSocket(to, function(err, socket) {
      if (!err) {
        socket.end(from);
      }
    }, callback);
  } else if (typeof from === 'string') {
    fs.stat(from, function(err, stats) {
      if (err && err.code === 'ENOENT') {
        return callback(new Error("Local file doesn't exist."));
      }

      if (stats.isDirectory()) {
        return callback(new Error('Local path cannot be a directory'));
      }

      var totalSize = err ? 0 : stats.size;
      var bs = 4 * 1024;
      var localFileStream = fs.createReadStream(from, {
        bufferSize: bs
      });
      putReadable(localFileStream, to, totalSize, callback, bs);
    });
  } else { // `from` is a readable stream
    putReadable(from, to, from.size, callback);
  }
};

function parsePasvList(data) {
  var list = data.split("\r\n"),
    arr = [],
    year = new Date().getFullYear(),
    i = 0,
    len = list.length;

  function getName(s, s1, s2) {
    var n = 1;
    while (true) {
      var t = "",
        i = 0;
      for (i = 0; i < n; i++) {
        t += " ";
      }
      t = s1 + t + s2;
      if (s.indexOf(t) > -1) {
        return s.substring(s.indexOf(t) + 1);
      }
      n++;
      if (n > 20) {
        break;
      }
    }
    return "";
  }

  for (i = 0; i < len; i++) {
    if (!list[i]) {
      continue;
    }
    var o = {type: 'f'},
      temp = list[i].split(/\s+/);
    if (list[i].substring(0, 1) === 'd') { o.type = 'd'; }
    o.size = parseInt(temp[4], 10);
    var dt = temp[5] + " " + temp[6] + " " + (temp[7].indexOf(":") > -1 ? year + " " + temp[7] + ":00 GMT+0000" : temp[7]);
    o.date = new Date(dt);
    if (temp.length === 9) {
      o.name = temp[8];
    } else {
      o.name = getName(list[i], temp[6], temp[7]);
    }
    o.str = list[i];
    arr.push(o);
  }
  return arr;
}

EFTP.prototype.init = function (config) {
  this.isConnect = false;
  this.isLoginFail = false;
  this.waitCount = 0;
  this.config = _.defaultsDeep(config, {
    host: 'localhost',
    port: 21,
    type: 'ftp',
    username: 'anonymous',
    password: 'anonymous@'
  });
  this.config.user = this.config.username;
  if (!this.config.type) {
    this.config.type = 'ftp';
  }
  if (this.config.type === 'sftp' && FileUtil.existSync(this.config.privateKey)) {
    this.config.privateKey = fs.readFileSync(this.config.privateKey);
  }
};

EFTP.prototype.connect = function (config) {
  var self = this;
  self.events = {
    ready: function (err) {
      if (!err) {
        self.isConnect = true;
        self.pwd(function () {
          self.emit('ready', self.client);
        });
      }
    },
    close: function (err) {
      self.emit('close', err);
      self.close();
    },
    error: function (err) {
      self.emit('error', err);
      self.close();
    },
    progress: _.throttle(function (data) {
      self.emit('progress', {
        queuer: data.queuer,
        direction: data.direction,
        total: data.total,
        transferred: data.transferred,
        percents: data.transferred / data.total
      });
    }, 100)
  };
  _progressEvent = self.events.progress;
  
  if (!config) {
    throw "must config param";
  }
  this.init(config);
  
  switch (this.config.type) {
    case 'sftp':
      this.client = new SSHClient();
      var c = {
        host: config.host,
        port: config.port || 22,
        username: config.username
      };
      if (config.privateKey !== undefined) {
        c.privateKey = config.privateKey;
        if (config.password) {
          c.passphrase = config.password;
        }
      } else {
        c.password = config.password;
      }
      this.client.on('continue', function() {
        debug('continue event fired');
      });
      this.client.on('ready', self.events.ready);
      this.client.on('close', self.events.close);
      this.client.on('error', self.events.error);
      this.client.connect(c);
      break;
    case 'ftp':
      this.client = new FTPClient({
        host: config.host,
        port: config.port || 21,
        user: config.username,
        pass: config.password
      });
      //this.client.on('connect', self.events.ready);
      this.client.on('timeout', self.events.close);
      this.client.on('error', self.events.error);
      this.client.on('progress', self.events.progress);
      this.client.auth(config.username, config.password, function (err, response) {
        if (err) {
          self.isLoginFail = true;
          self.events.error(err);
        } else {
          self.client.ls("/", function (err, list) {
            if (!err) {
              self.isPasv = false;
            } else {
              self.client.list("/", function (err, list) {
                if (!err) {
                  self.isPasv = true;
                } else {
                  self.events.error(err);
                }
              });
            }
          });
          self.events.ready(undefined);
        }
      });
      break;
    default:
      this.emit("error", new Error("Wrong protocol submitted"));
      break;
  }
};

EFTP.prototype.close = function () {
  try {
    this.client.end();
  } catch (e) {
  } finally { this.client = null; }
};

EFTP.prototype.getRealRemotePath = function (path) {
  var p = path;
  if (path.indexOf("/") !== 0) {
    var tempCurrentPath = this.currentPath;
    if (path.indexOf("./") === 0 && path.length > 2) {
      path = path.substring(2);
    }
    var upIdx = path.indexOf("../");
    while (upIdx === 0 && tempCurrentPath !== "/") {
      tempCurrentPath = tempCurrentPath.substring(0, tempCurrentPath.lastIndexOf("/"));
      path = path.substring(3);
      upIdx = path.indexOf("../");
    }
    if (tempCurrentPath === '/') {
      p = tempCurrentPath + path;
    } else {
      p = tempCurrentPath + "/" + path;
    }
  }
  if (p.length > 1 && /\/$/.test(p)) { p = p.substring(0, p.length - 1); }
  return p;
};

EFTP.prototype.waitConnect = function (cb) {
  var self = this;
  if (this.isLoginFail || this.waitCount >= 50) {
    this.close();
    return;
  }
  if (!this.isConnect) {
    this.waitCount++;
    setTimeout(function () {
      self.waitConnect(cb);
    }, 500);
  } else {
    this.waitCount = 0;
    cb();
  }
};

EFTP.prototype.pwd = function (cb) {
  if (!cb) {
    cb = function () {};
  }
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.pwd(cb);
    });
  } else {
    switch (this.config.type) {
      case 'sftp':
        self.client.exec('pwd', function (err, stream) {
          if (err) {
            cb(err, '');
            return false;
          }
          stream.on('end', function() {
            //console.log('Should I end connection?');
          }).on('data', function(data) {
            data = data.toString();
            data = data.replace(/(\n|\r)/, '');
            self.currentPath = data;
            cb(undefined, data);
          });
        });
        /*
        //ALT METHOD
        self.client.sftp(function(err, sftp){
          sftp.realpath(".", function(err, path){
              sftp.end();
              self.currentPath = path;
              cb(err, path);
          });
        });
        */
        break;
      case 'ftp':
        self.client.raw.pwd(function (err, data) {
          if (!err && data) {
            var idx = data.text.indexOf("\"");
            data = data.text.substring(idx + 1, data.text.indexOf("\"", idx + 1));
            self.currentPath = data;
          }
          cb(err, data);
        });
        break;
    }
  }
};

EFTP.prototype.cd = function (path, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.cd(path, cb);
    });
  } else {
    path = this.getRealRemotePath(path);
    switch (this.config.type) {
      case 'sftp':
        self.client.sftp(function (err, sftp) {
          if (!err) {
            sftp.opendir(path, function (err, handle) {
              sftp.end();
              if (err) {
                if (cb) {
                  cb(err);
                }
              } else {
                self.currentPath = path;
                if (cb) {
                  cb(err, path);
                }
              }
            });
          } else {
            cb(err);
          }
        });
        break;
      case 'ftp':
        this.client.raw.cwd(path, function (err, data) {
          if (!err) {
            self.currentPath = path;
            if (cb) {
              cb(err, path);
            }
          } else {
            if (cb) {
              cb(err);
            }
          }
        });
        break;
    }
  }
};

EFTP.prototype.ls = function (path, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.ls(path, cb);
    });
  } else {
    var p = this.getRealRemotePath(path);
    switch (this.config.type) {
    case 'sftp':
      self.client.sftp(function (err, sftp) {
        if (!err) {
          sftp.readdir(p, function (err, list) {
            sftp.end();
            if (err) {
              if (cb) { cb(err); }
            } else {
              var i = 0;
              for (i = 0; i < list.length; i++) {
                list[i].name = list[i].filename;
                list[i].date = new Date((list[i].attrs.mtime || list[i].attrs.atime) * 1000);
                list[i].size = list[i].attrs.size;
                list[i].type = list[i].longname.indexOf("d") === 0 ? 'd' : 'f';
              }
              if (cb) { cb(err, list); }
            }
          });
        } else {
          cb(err);
        }
      });
      break;
    case 'ftp':
      if (this.isPasv) {
        this.client.list(p, function (err, data) {
          if (!err) {
            if (cb) { cb(err, parsePasvList(data)); }
          } else if (cb) {
            cb(err);
          }
        });
      } else {
        this.client.ls(p, function (err, list) {
          if (!err) {
            var i = 0,
              len = list.length;
            for (i = 0; i < len; i++) {
              list[i].date = new Date(list[i].time);
              list[i].type = list[i].type === 1 ? 'd' : 'f';
            }
            if (cb) { cb(err, list); }
          } else if (cb) {
            cb(err);
          }
        });
      }
      break;
    }
  }
};

EFTP.prototype.exist = function (path, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.exist(path, cb);
    });
  } else {
    var cwd = this.currentPath;
    this.cd(path, function (err) {
      if (!err) {
        self.cd(cwd, function () {
          if (cb) { cb(true); }
        });
      } else {
        var parentPath = FileUtil.getParentPath(path);
        var fileName = FileUtil.getFileName(path);
        self.ls(parentPath, function (err, list) {
          self.cd(cwd, function () {
            if (err) {
              cb(false);
            } else {
              var exist = false,
                i = 0;
              for (i = 0; i < list.length; i++) {
                if (list[i].name === fileName) {
                  exist = true;
                  break;
                }
              }
              cb(exist);
            }
          });
        });
      }
    });
  }
};

EFTP.prototype.download = function (queuer, cb) {
  var self = this;
  queuer.localpath = FileUtil.replaceCorrectPath(queuer.localpath);
  var dir = FileUtil.getParentPath(queuer.localpath);
  
  if (!FileUtil.existSync(dir)) {
    try {
      FileUtil.mkdirSync(dir);
    } catch (err) {
      this.emit("error", new Error("Can't create local folder structure: " + dir));
    }
  }
  
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.download(queuer, cb);
    });
  } else {
    queuer.remotepath = this.getRealRemotePath(queuer.remotepath);
    switch (this.config.type) {
      case 'sftp':
        self.client.sftp(function (err, sftp) {
          if (!err) {
            sftp.fastGet(queuer.remotepath, queuer.localpath, {
              concurrency: 1,
              step: function (transferred, chunk, total) {
                self.events.progress({
                  queuer: queuer,
                  action: 'get',
                  total: total,
                  transferred: transferred
                });
              }
            }, function (err) {
              sftp.end();
              if (err) {
                cb(err);
              } else {
                self.emit("download", {
                  qid: queuer.qid,
                  remotepath: queuer.remotepath,
                  localpath: queuer.localpath
                });
                cb(err, {
                  qid: queuer.qid,
                  remotepath: queuer.remotepath,
                  localpath: queuer.localpath
                });
              }
            });
          } else {
            cb(err);
          }
        });
        break;
      case 'ftp':
        self.ls(queuer.remotepath, function(err, list) {
          if (!err && _.isArray(list)) {
            list.some(function(v, i) {
              if (v.type === 'f') {
                queuer.size = list[0].size;
                return true;
              }
            });
            self.client._get(queuer, function (err) {
              if (err) {
                if (cb) {
                  cb(err);
                }
              } else {
                self.emit("download", {
                  qid: queuer.qid,
                  remotepath: queuer.remotepath,
                  localpath: queuer.localpath
                });
                if (cb) {
                  cb(err, {
                    qid: queuer.qid,
                    remotepath: queuer.remotepath,
                    localpath: queuer.localpath
                  });
                }
              }
            });
          }
        });
        break;
    }
  }
};

EFTP.prototype.upload = function (queuer, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.upload(queuer, cb);
    });
  } else {
    queuer.remotepath = this.getRealRemotePath(queuer.remotepath);
    var action = function () {
      switch (self.config.type) {
        case 'sftp':
          self.client.sftp(function (err, sftp) {
            debug('self.client.sftp:', err, sftp);
            if (!err) {
              debug('firing fastPut:', queuer.localpath, queuer.remotepath);
              sftp.fastPut(queuer.localpath, queuer.remotepath, {
                concurrency: 1
              }, function (err) {
                debug('sftp.fastPut err:', err);
                sftp.end();
                if (err) {
                  cb(err);
                } else {
                  self.emit("upload", {
                    qid: queuer.qid,
                    remotepath: queuer.remotepath,
                    localpath: queuer.localpath
                  });
                  cb(err, {
                    qid: queuer.qid,
                    remotepath: queuer.remotepath,
                    localpath: queuer.localpath
                  });
                }
              });
            } else {
              cb(err);
            }
          });
          break;
        case 'ftp':
          self.client._put(queuer, function (err) {
            if (err) {
              if (cb) {
                cb(err);
              }
            } else {
              self.emit("upload", {
                qid: queuer.qid,
                remotepath: queuer.remotepath,
                localpath: queuer.localpath
              });
              if (cb) {
                cb(err, {
                  qid: queuer.qid,
                  remotepath: queuer.remotepath,
                  localpath: queuer.localpath
                });
              }
            }
          });
          break;
      }
    };
    self.exist(queuer.remotepath, function (result) {
      if (result) {
        action();
      } else {
        var parentPath = utils.getNamepart(queuer.remotepath, 'parentPath');
        self.exist(parentPath, function (result) {
          if (result) {
            action();
          } else {
            self.mkdir(parentPath, function (err, data) {
              if (!err) {
                action();
              } else {
                self.events.error(err);
              }
            });
          }
        });
      }
    });
  }
};

EFTP.prototype.mkdir = function (path, cb) {
  if (!cb) {
    cb = function () {};
  }
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.mkdir(path, cb);
    });
  } else {
    var p = this.getRealRemotePath(path);
    switch (this.config.type) {
      case 'sftp':
        this.client.exec('mkdir -p "' + p + '"', function (err, stream) {
          cb(err);
        });
        break;
      case 'ftp':
        self.client.raw.mkd(p, function (err, data) {
          if (!err && data) {
            var idx = data.text.indexOf("\"");
            data = data.text.substring(idx + 1, data.text.indexOf("\"", idx + 1));
          }
          cb(err, data);
        });
        break;
    }
  }
};


/*

EFTP.prototype.rm = function (path, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.rm(path, cb);
    });
  } else {
    var p = this.getRealRemotePath(path);
    if (this.isFTP) {
      this.client.rm(p, function (err) {
        if (cb) { cb(err); }
      });
    } else {
      this.client.exec('rm -rf "' + p + '"', function (err, stream) {
        if (cb) { cb(err); }
      });
    }
  }
};

EFTP.prototype.mv = function (oldPath, newPath, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.mv(oldPath, newPath, cb);
    });
  } else {
    var op = this.getRealRemotePath(oldPath);
    var np = this.getRealRemotePath(newPath);
    if (this.isFTP) {
      this.client.mv(op, np, function (err, newPath) {
        if (cb) { cb(err, np); }
      });
    } else {
      self.client.sftp(function (err, sftp) {
        sftp.rename(op, np, function (err) {
          sftp.end();
          if (cb) { cb(err, np); }
        });
      });
    }
  }
};

*/

module.exports = EFTP;