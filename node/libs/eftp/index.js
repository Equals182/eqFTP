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
  _ = require('lodash'),
  semver = require('semver');

var once = require('once'),
  NOOP = function () { },
  _fix_version = false;

if (semver.ltr(process.version.replace(/^[^d]/, ''), '0.10.30')) {
  _fix_version = '0.10.30';
}

FTPClient.prototype._emitProgress = _.throttle(function (data) {
  this.emit('progress', {
    queuer: data.queuer,
    action: data.action,
    total: data.totalSize || data.queuer.size,
    transferred: data.socket[data.action === 'get' ? 'bytesRead' : 'bytesWritten']
  });
}, 100);

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

      socket.on('readable', function () {
        self._emitProgress({
          queuer: queuer,
          action: 'get',
          socket: socket
        });
      });

      // This ensures that any expected outcome is handled. There is no
      // danger of the callback being executed several times, because it is
      // wrapped in `once`.
      socket.on('error', callback);
      socket.on('end', callback);
      socket.on('close', callback);

      socket.pipe(writeStream);
      if (_fix_version === '0.10.30') {
        socket.resume();
      }
    };
  }

  this.getGetSocket(queuer.remotepath, finalCallback);
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

function EasyFTP() {
  if (!this instanceof EasyFTP) { throw "must 'new EasyFTP()'"; }
  EventEmitter.call(this);
}
util.inherits(EasyFTP, EventEmitter);

EasyFTP.prototype.init = function (config) {
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

EasyFTP.prototype.connect = function (config) {
  var self = this;
  if (!config) {
    throw "must config param";
  }
  this.init(config);
  
  var events = {
    ready: function (err) {
      if (!err) {
        self.isConnect = true;
        self.pwd(function () {
          self.emit('ready', self.client);
          console.log('!!!ready: ', arguments);
        });
      }
    },
    close: function (err) {
      self.emit('close', err);
      self.close();
      console.log('!!!close: ', arguments);
    },
    error: function (err) {
      self.emit('error', err);
      self.close();
      console.log('!!!error: ', arguments);
    },
    progress: function (data) {
      self.emit('progress', {
        queuer: data.queuer,
        direction: (data.action === 'get')?'download':'upload',
        total: data.total,
        transferred: data.transferred,
        percents: data.transferred / data.total
      });
    }
  };
  this.events = events;
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
        console.log('NEXT QUESTION!');
      });
      this.client.on('ready', events.ready);
      this.client.on('close', events.close);
      this.client.on('error', events.error);
      this.client.connect(c);
      break;
    case 'ftp':
      this.client = new FTPClient({
        host: config.host,
        port: config.port || 21,
        user: config.username,
        pass: config.password
      });
      //this.client.on('connect', events.ready);
      this.client.on('timeout', events.close);
      this.client.on('error', events.error);
      this.client.on('progress', events.progress);
      this.client.auth(config.username, config.password, function (err, response) {
        if (err) {
          self.isLoginFail = true;
          events.error(err);
        } else {
          self.client.ls("/", function (err, list) {
            if (!err) {
              self.isPasv = false;
            } else {
              self.client.list("/", function (err, list) {
                if (!err) {
                  self.isPasv = true;
                } else {
                  events.error(err);
                }
              });
            }
          });
          events.ready(undefined);
        }
      });
      break;
    default:
      this.emit("error", new Error("Wrong protocol submitted"));
      break;
  }
};

EasyFTP.prototype.close = function () {
  try {
    this.client.end();
  } catch (e) {
  } finally { this.client = null; }
};

EasyFTP.prototype.getRealRemotePath = function (path) {
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

EasyFTP.prototype.waitConnect = function (cb) {
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

EasyFTP.prototype.pwd = function (cb) {
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

EasyFTP.prototype.cd = function (path, cb) {
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

EasyFTP.prototype.ls = function (path, cb) {
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

EasyFTP.prototype.exist = function (path, cb) {
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

EasyFTP.prototype.download = function (queuer, cb) {
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
      self.download(queuer.localpath, queuer.remotepath, cb);
    });
  } else {
    switch (this.config.type) {
      case 'sftp':
        self.client.sftp(function (err, sftp) {
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
                _id: queuer._id,
                remotepath: queuer.remotepath,
                localpath: queuer.localpath
              });
              cb(err, {
                _id: queuer._id,
                remotepath: queuer.remotepath,
                localpath: queuer.localpath
              });
            }
          });
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
                  _id: queuer._id,
                  remotepath: queuer.remotepath,
                  localpath: queuer.localpath
                });
                if (cb) {
                  cb(err, {
                    _id: queuer._id,
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

EasyFTP.prototype.upload = function (queuer, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.download(queuer.localpath, queuer.remotepath, cb);
    });
  } else {
    var action = function () {
      switch (self.config.type) {
        case 'sftp':
          self.client.sftp(function (err, sftp) {
            sftp.fastPut(queuer.localpath, queuer.remotepath, {
              concurrency: 1
            }, function (err) {
              sftp.end();
              if (err) {
                cb(err);
              } else {
                self.emit("upload", {
                  _id: queuer._id,
                  remotepath: queuer.remotepath,
                  localpath: queuer.localpath
                });
                cb(err, {
                  _id: queuer._id,
                  remotepath: queuer.remotepath,
                  localpath: queuer.localpath
                });
              }
            });
          });
          break;
        case 'ftp':
          self.client.put(queuer.localpath, queuer.remotepath, function (err) {
            if (err) {
              if (cb) {
                cb(err);
              }
            } else {
              self.emit("upload", {
                _id: queuer._id,
                remotepath: queuer.remotepath,
                localpath: queuer.localpath
              });
              if (cb) {
                cb(err, {
                  _id: queuer._id,
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
        self.mkdir(queuer.remotepath, function (err, data) {
          if (!err) {
            action();
          } else {
            self.events.error(err);
          }
        });
      }
    });
  }
};

EasyFTP.prototype.mkdir = function (path, cb) {
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


EasyFTP.prototype.upload = function (localpath, remotepath, cb, isRecursive) {
  var self = this;

  function bodyDir(localpath, parent, cwd) {
    var list = FileUtil.lsSync(localpath);
    loop(list, function (i, value, next) {
      //console.log("bodyDir start : ", localpath + "/" + value, parent + "/" + value);
      self.upload(localpath + "/" + value, parent + "/" + value, function (err) {
        //console.log("bodyDir end : ", localpath + "/" + value, parent + "/" + value, err);
        next(err);
      }, true);
    }, function (err) {
      self.cd(cwd, function () {
        if (cb) { cb(err); }
      });
    });
  }

  function uploadFile(localpath, remotepath, cwd) {
    if (self.isFTP) {
      self.client.upload(localpath, remotepath, function (err) {
        if (!err) { self.emit("upload", remotepath); }
        self.cd(cwd, function () {
          if (cb) { cb(err); }
        });
      });
    } else {
      self.client.sftp(function (err, sftp) {
        sftp.fastPut(localpath, remotepath, {concurrency: 1}, function (err) {
          sftp.end();
          if (!err) { self.emit("upload", remotepath); }
          self.cd(cwd, function () {
            if (cb) { cb(err); }
          });
        });
      });
    }
  }

  if (!this.isConnect) {
    this.waitConnect(function () {
      self.upload(localpath, remotepath, cb, isRecursive);
    });
  } else {
    var cwd = this.currentPath;
    if (localpath instanceof Array) {
      if (typeof remotepath === 'function') {
        cb = remotepath;
        remotepath = null;
      }
      loop(localpath, function (i, value, next) {
        var local = value;
        var remote = remotepath;
        if (typeof value === 'object') {
          local = value.local;
          remote = value.remote;
        }
        self.upload(local, remote, function (err) {
          next(err);
        });
      }, function (err) {
        self.cd(cwd, function () {
          if (cb) { cb(err); }
        });
      });
      return;
    }
    localpath = FileUtil.replaceCorrectPath(localpath);
    if (/\/\*{1,2}$/.test(localpath)) {
      isRecursive = true;
      localpath = localpath.replace(/\/\*{1,2}$/, '');
    }
    remotepath = this.getRealRemotePath(remotepath);
    if (FileUtil.isDirSync(localpath)) {
      var parent = FileUtil.replaceCorrectPath(remotepath + (isRecursive ? "" : "/" + FileUtil.getFileName(localpath)));
      this.cd(parent, function (err) {
        if (err) {
          self.mkdir(parent, function (err) {
            //console.log("mkdir : ", parent, err);
            if (err) {
              self.cd(cwd, function () {
                if (cb) { cb(err); }
              });
            } else {
              self.emit("upload", parent);
              bodyDir(localpath, parent, cwd);
            }
          });
        } else {
          bodyDir(localpath, parent, cwd);
        }
      });
    } else {
      if (!isRecursive) {
        this.cd(remotepath, function (err) {
          if (!err) {
            remotepath = FileUtil.replaceCorrectPath(remotepath + "/" + FileUtil.getFileName(localpath));
          }
          var parent = FileUtil.getParentPath(remotepath);
          self.cd(parent, function (err) {
            if (err) {
              self.mkdir(parent, function (err) {
                if (err) {
                  self.cd(cwd, function () {
                    if (cb) { cb(err); }
                  });
                } else {
                  self.emit("upload", parent);
                  uploadFile(localpath, remotepath, cwd);
                }
              });
            } else {
              uploadFile(localpath, remotepath, cwd);
            }
          });
        });
      } else {
        uploadFile(localpath, remotepath, cwd);
      }
    }
  }
};




EasyFTP.prototype.rm = function (path, cb) {
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

EasyFTP.prototype.mv = function (oldPath, newPath, cb) {
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

module.exports = EasyFTP;