/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true, continue:true */

"use strict";

var util = require('util');
var JSFtp  = require('jsftp');
var loop = require('easy-loop');
var EventEmitter = require('events').EventEmitter;
var pathUtil = require('./lib/path-util');
var fileUtil = require('./lib/file-util');

function FTP(config) {
  if (!this instanceof FTP) { throw "must 'new FTP(config)'"; }
  EventEmitter.call(this);
  if (config.username) { config.user = config.username; }
  if (config.password) { config.pass = config.password; }
  if (!config.host) { config.host = "127.0.0.1"; }
  if (!config.port) { config.port = 21; }
  this.currentPath = "/";
  this.isPasv = false;
  this.isLoginFail = false;
  this.waitCount = 0;
  this.isConnect = false;
  if (config.debugMode === true) { config.debugMode = true; }
  this.client = new JSFtp(config);
  this.init(config);
}
util.inherits(FTP, EventEmitter);

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

FTP.prototype.init = function (config) {
  var self = this;
  var p = "/";
  if (config.path) { p = this.getRealRemotePath(config.path); }
  this.cd(p, function (err, path) {
    function body() {
      self.isConnect = true;
      self.currentPath = p;
      self.checkPasv(function () {
        self.emit("open", self.client);
        self.emit("ready", self.client);
      });
    }
    if (!err) {
      body();
    } else {
      self.cd("/", function (err, path) {
        if (!err) {
          body();
        } else {
          self.emit("error", err);
        }
      });
    }
  });
  this.client.on('jsftp_debug', function (event, data) {
    self.event(event, data);
  });
};
FTP.prototype.waitConnect = function (cb) {
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
FTP.prototype.cd = function (path, cb) {
  var self = this;
  var p = this.getRealRemotePath(path);
  this.client.raw.cwd(p, function (err, data) {
    if (cb) { cb(err, p); }
  });
};
FTP.prototype.rm = function (path, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.rm(path, cb);
    });
    return;
  }
  var p = this.getRealRemotePath(path);

  function deleteChild(path, cb) {
    self.ls(path, function (err, list) {
      if (!err) {
        loop(list, function (i, value, next) {
          self.rm(path + "/" + value.name, function (err) {
            next(err);
          });
        }, function (err) {
          if (cb) { cb(err); }
        });
      } else if (cb) {
        cb(err);
      }
    });
  }

  this.client.raw.dele(p, function (err) {
    if (err) {
      self.client.raw.rmd(p, function (err) {
        if (err) {
          deleteChild(p, function (err) {
            if (!err) {
              self.rm(p, function (err) {
                if (cb) { cb(err); }
              });
            } else if (cb) {
              cb(err);
            }
          });
        } else if (cb) {
          cb(err);
        }
      });
    } else {
      if (cb) { cb(err); }
    }
  });
};
FTP.prototype.mkdir = function (path, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.mkdir(path, cb);
    });
    return;
  }
  var p = this.getRealRemotePath(path);
  this.exist(p, function (result) {
    if (!result) {
      self.client.raw.mkd(p, function (err) {
        if (err) {
          var arr = p.split("/");
          var i = 2, len = arr.length;
          var errorCnt = len - i;
          loop(function () {
            return i <= len;
          }, function (next) {
            var pp = arr.slice(0, i).join("/");
            self.client.raw.mkd(pp, function (err) {
              if (err) { errorCnt--; }
              i++;
              next();
            });
          }, function (err) {
            if (cb) {
              cb(len > 2 && errorCnt < 0 ? "mkdir fail : " + p : err);
            }
          });
        } else if (cb) {
          cb(err);
        }
      });
    } else if (cb) {
      cb(undefined);
    }
  });
};
FTP.prototype.mv = function (oldPath, newPath, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.mv(oldPath, newPath, cb);
    });
    return;
  }
  var op = this.getRealRemotePath(oldPath);
  var np = this.getRealRemotePath(newPath);
  this.client.rename(op, np, function (err, res) {
    if (cb) { cb(err, np); }
  });
};
FTP.prototype.ls = function (path, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.ls(path, cb);
    });
    return;
  }
  var p = this.getRealRemotePath(path);
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
};
FTP.prototype.pwd = function (cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.pwd(cb);
    });
    return;
  }
  this.client.raw.pwd(function (err, data) {
    if (!err && data) {
      var idx = data.text.indexOf("\"");
      data = data.text.substring(idx + 1, data.text.indexOf("\"", idx + 1));
    }
    cb(err, data);
  });
};
FTP.prototype.exist = function (path, cb) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.exist(path, cb);
    });
    return;
  }
  var p = this.getRealRemotePath(path);
  var result = false;
  this.ls(pathUtil.getParentPath(p), function (err, list) {
    if (!err) {
      var i = 0;
      for (i = 0; i < list.length; i++) {
        if (list[i].name === pathUtil.getFileName(p)) {
          result = true;
          break;
        }
      }
      if (cb) { cb(result); }
    } else if (cb) {
      cb(result);
    }
  });
};

FTP.prototype.upload = function (localPath, remotePath, cb, isRecursive) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.upload(localPath, remotePath, cb, isRecursive);
    });
    return;
  }
  var cwd = this.currentPath;
  function bodyDir(localPath, parent, cwd) {
    var list = fileUtil.lsSync(localPath);
    loop(list, function (i, value, next) {
      self.upload(localPath + "/" + value, parent + "/" + value, function (err) {
        next(err);
      }, true);
    }, function (err) {
      self.cd(cwd, function () {
        if (cb) { cb(err); }
      });
    });
  }
  function uploadFile(localPath, remotePath, cwd) {
    fileUtil.readFile(localPath, function (err, data) {
      if (!err) {
        self.client.put(data, remotePath, function (err) {
          if (!err) { self.emit("upload", remotePath); }
          self.cd(cwd, function () {
            if (cb) { cb(err); }
          });
        });
      } else if (cb) {
        self.cd(cwd, function () {
          if (cb) { cb(err); }
        });
      }
    });
  }

  if (localPath instanceof Array) {
    if (typeof remotePath === 'function') {
      cb = remotePath;
      remotePath = null;
    }
    loop(localPath, function (i, value, next) {
      var local = value;
      var remote = remotePath;
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
  localPath = pathUtil.normalize(localPath);
  if (/\/\*{1,2}$/.test(localPath)) {
    isRecursive = true;
    localPath = localPath.replace(/\/\*{1,2}$/, '');
  }
  remotePath = this.getRealRemotePath(remotePath);
  if (fileUtil.isDirSync(localPath)) {
    var parent = pathUtil.normalize(remotePath + (isRecursive ? "" : "/" + pathUtil.getFileName(localPath)));
    this.cd(parent, function (err) {
      if (err) {
        self.mkdir(parent, function (err) {
          if (err) {
            self.cd(cwd, function () {
              if (cb) { cb(err); }
            });
          } else {
            self.emit("upload", parent);
            bodyDir(localPath, parent, cwd);
          }
        });
      } else {
        bodyDir(localPath, parent, cwd);
      }
    });

  } else {
    if (!isRecursive) {
      this.cd(remotePath, function (err) {
        if (!err) {
          remotePath = pathUtil.normalize(remotePath + "/" + pathUtil.getFileName(localPath));
        }
        var parent = pathUtil.getParentPath(remotePath);
        self.cd(parent, function (err) {
          if (err) {
            self.mkdir(parent, function (err) {
              if (err) {
                self.cd(cwd, function () {
                  if (cb) { cb(err); }
                });
              } else {
                self.emit("upload", parent);
                uploadFile(localPath, remotePath, cwd);
              }
            });
          } else {
            uploadFile(localPath, remotePath, cwd);
          }
        });
      });
    } else {
      uploadFile(localPath, remotePath, cwd);
    }

  }
};
FTP.prototype.download = function (remotePath, localPath, cb, isRecursive) {
  var self = this;
  if (!this.isConnect) {
    this.waitConnect(function () {
      self.download(remotePath, localPath, cb, isRecursive);
    });
    return;
  }
  var cwd = this.currentPath;

  function bodyDir(remotePath, parent, cwd) {
    self.ls(remotePath, function (err, list) {
      loop(list, function (i, value, next) {
        self.download(remotePath + "/" + value.name, parent + "/" + value.name, function (err) {
          next(err);
        }, true);
      }, function (err) {
        self.cd(cwd, function () {
          if (cb) { cb(); }
        });
      });
    });
  }

  function bodyFile(localPath, remotePath, cwd) {
    self.client.get(remotePath, localPath, function (err) {
      if (!err) { self.emit("download", localPath); }
      self.cd(cwd, function () {
        if (cb) { cb(err); }
      });
    });
  }

  if (remotePath instanceof Array) {
    if (typeof localPath === 'function') {
      cb = localPath;
      localPath = null;
    }
    loop(remotePath, function (i, value, next) {
      var local = localPath;
      var remote = value;
      if (typeof value === 'object') {
        local = value.local;
        remote = value.remote;
      }
      self.download(remote, local, function (err) {
        next(err);
      });
    }, function (err) {
      self.cd(cwd, function () {
        if (cb) { cb(err); }
      });
    });
    return;
  }
  remotePath = this.getRealRemotePath(remotePath);
  var tempLocalPath = localPath;
  localPath = pathUtil.normalize(localPath);
  if (/\/\*{1,2}$/.test(remotePath)) {
    isRecursive = true;
    remotePath = remotePath.replace(/\/\*{1,2}$/, '');
  }

  this.cd(remotePath, function (err, path) {
    if (err) {
      if (!isRecursive) {
        if (fileUtil.isDirSync(localPath)) {
          localPath = pathUtil.normalize(localPath + "/" + pathUtil.getFileName(remotePath));
        } else {
          if (/\/$/.test(tempLocalPath)) {
            fileUtil.mkdirSync(tempLocalPath);
            localPath = tempLocalPath + pathUtil.getFileName(remotePath);
          } else {
            fileUtil.mkdirSync(pathUtil.getParentPath(localPath));
          }
        }
      }
      bodyFile(localPath, remotePath, cwd);
    } else {
      var parent = pathUtil.normalize(localPath + (isRecursive ? "" : "/" + pathUtil.getFileName(remotePath)));
      if (!fileUtil.existSync(parent)) {
        fileUtil.mkdirSync(parent);
        self.emit("download", parent);
      }
      bodyDir(remotePath, parent, cwd);
    }
  });
};
FTP.prototype.end = FTP.prototype.close = function (cb) {
  var self = this;
  this.client.raw.quit(function (err, data) {
    self.emit("close");
  });
};
FTP.prototype.getRealRemotePath = function (path) {
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
FTP.prototype.checkPasv = function (cb) {
  var self = this;
  /*
	var flag = false;
	self.client.ls("/", function (err, list) {
		console.log("active", err ? 1 : 0);
		if (!err) 
		{	
			self.isPasv = false;
			if (!flag && cb) cb();
			flag = true;
		}
	});
	self.client.list("/", function (err, list) {
		console.log("passive", err ? 1 : 0);
		if (!err)
		{
			self.isPasv = true;
			if (!flag && cb) cb();
			flag = true;
		}
	});	
	*/
  this.client.ls("/", function (err, list) {
    //console.log("active", err ? 1 : 0);
    if (!err) {
      self.isPasv = false;
      if (cb) { cb(); }
    } else {
      self.client.list("/", function (err, list) {
        //console.log("passive", err ? 1 : 0);
        if (!err) {
          self.isPasv = true;
          if (cb) { cb(); }
        } else if (cb) {
          cb(err);
        }
      });
    }
  });
};
FTP.prototype.event = function (eventType, data) {
  if (!data) { return; }
  //console.log("event : ", eventType, JSON.stringify(data));
  if (data.code >= 400 && data.code <= 599) { this.emit("error", data.text); }
};

module.exports = FTP;