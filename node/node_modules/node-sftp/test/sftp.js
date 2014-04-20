/**
 * @package node-sftp
 * @subpackage test
 * @copyright  Copyright(c) 2011 Ajax.org B.V. <info AT ajax.org>
 * @author Mike de Boer <mike AT ajax DOT org>
 * @license http://github.com/ajaxorg/node-sftp/blob/master/LICENSE MIT License
 */

var assert = require("assert");
var sftp = require("./../index");
var fs = require("fs");
var path = require("path");

var secrets = require("./secrets");

var prvkey = secrets.prvkey;
var pubkey = secrets.pubkey;

var host = secrets.host;

module.exports = {
    
    timeout: 10000,
    
    setUp : function(next) {
        next();
    },
    
    tearDown : function(next) {
        if (this.obj)
            this.obj.disconnect(next);
        else
            next();
    },
    
    "<test connection to localhost": function(next) {
        var obj = this.obj  = new sftp({username: "mike", password: "mike1324"}, function(err) {
            assert.equal(err, null);
            next();
        });
    },
    
    "test connection to host with private key file": function(next) {
        var obj = this.obj  = new sftp({host: "localhost", username: "mike", privateKey: "~/.ssh/id_rsa"}, function(err) {
            assert.equal(err, null);
            next();
        });
    },
    
    "test connection to host with private key plain text": function(next) {
        var _self = this;
        var obj = _self.obj = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            next();
        });
    },
    
    "test connection to host with home dir set": function(next) {
        var _self = this;
        var obj = _self.obj = new sftp({host: host, username: "sshtest", home: "/home/sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            obj.pwd(function(err, path) {
                assert.equal(err, null);
                assert.equal(path, "/home/sshtest");
                next();
            });
        });
    },
    
    "test disconnecting from remote host": function(next) {
        var obj = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            // exec command:
            obj.disconnect(function(err) {
                assert.equal(err, null);
                next();
            });
        });
    },

    "test sending CD command to localhost": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            // exec command:
            obj.cd("c9/server/c9/db", function(err) {
                assert.equal(err, null);
                // check:
                obj.ls(".", function(err, res) {
                    assert.equal(err, null);
                    assert.equal(res[0].path, "./file.js");
                    next();
                });
            });
        });
    },
    
    "test readFile() for non-existing file": function(next) {
        var obj = this.obj = new sftp({host: host, home: "/home/sshtest", username: "sshtest", privateKey: prvkey}, function(err) {
            var file = "/tmp/testsftpget";
            assert.equal(err, null);
            // exec command:
            try {
                fs.unlinkSync(file);
            }
            catch (ex) {}
            obj.readFile(".xxxprofile", "utf8", function(err, data) {
                assert.equal(err, "Couldn't stat remote file: No such file or directory");
                assert.equal(data, null);
                next();
            });
        });
    },
    
    "test readFile() for existing file in UTF8": function(next) {
        var obj = this.obj = new sftp({host: host, home: "/home/sshtest", username: "sshtest", privateKey: prvkey/*"~/.ssh/id_rsa"*/}, function(err) {
            assert.equal(err, null);

            obj.readFile(".profile", "utf8", function(err, data) {
                assert.equal(err, null);
                assert.ok(data.indexOf("PATH=") > -1);
                next();
            });
        });
    },
    
    "test readFile() for existing file in BUFFER": function(next) {
        var obj = this.obj = new sftp({host: host, home: "/home/sshtest", username: "sshtest", privateKey: prvkey/*"~/.ssh/id_rsa"*/}, function(err) {
            assert.equal(err, null);

            obj.readFile(".profile", null, function(err, data) {
                assert.equal(err, null);
                assert.ok(Buffer.isBuffer(data));
                assert.ok(data.toString("utf8").indexOf("PATH=") > -1);
                next();
            });
        });
    },
    
    "test readdir() for non-existing directory": function(next) {
        var obj = this.obj = new sftp({host: host, home: "/home/sshtest", username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            // exec command:
            obj.readdir("c9", function(err, res) {
                assert.equal(err, "Couldn't stat remote file: No such file or directory");
                next();
            });
        });
    },
    
    "test readdir() for existing directory": function(next) {
        var obj = this.obj = new sftp({host: host, home: "/home/sshtest", username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            // exec command:
            obj.readdir("/home/sshtest", function(err, res) {
                assert.equal(err, null);
                assert.equal(res[0], ".bash_history");
                next();
            });
        });
    },
    
    "test sending PWD command to localhost": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            // exec command:
            obj.pwd(function(err, dir) {
                assert.equal(err, null);
                assert.equal(dir, "/home/sshtest");
                next();
            });
        });
    },
    
    "test stat for new non-empty file": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            var file = __dirname + "/fixtures/a.js";
            obj.writeFile("a.js", fs.readFileSync(file, "utf8"), null, function(err) {
                assert.equal(err, null);
                obj.stat("a.js", function(err, stat) {
                    assert.equal(fs.statSync(file).size, stat.size);
                    assert.ok(stat.isFile());
                    assert.ok(!stat.isDirectory());
                    obj.unlink("a.js", next);
                });
            });
        });
    },
    
    "test stat for new empty file": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            var file = __dirname + "/fixtures/empty.txt";
            obj.writeFile("empty.txt", fs.readFileSync(file), null, function(err) {
                assert.equal(err, null);
                obj.stat("empty.txt", function(err, stat) {
                    assert.equal(err, null);
                    assert.equal(fs.statSync(file).size, stat.size);
                    assert.ok(stat.isFile());
                    assert.ok(!stat.isDirectory());
                    obj.unlink("a.js", next);
                });
            });
        });
    },
    
    "test unlinking new file": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            var file = __dirname + "/fixtures/a.js";
            obj.writeFile("a.js", fs.readFileSync(file, "utf8"), null, function(err) {
                assert.equal(err, null);
                obj.unlink("a.js", function(err) {
                    assert.equal(err, null);
                    obj.stat("a.js", function(err, stat) {
                        assert.equal(err, "Couldn't stat remote file: No such file or directory");
                        next();
                    });
                });
            });
        });
    },
    
    "test unlinking non-existing file": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            obj.unlink("youdonotexists.xxx", function(err) {
                assert.equal(err, "Couldn't delete file: No such file or directory");
                next();
            });
        });
    },
    
    "test renaming new file": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            var file = __dirname + "/fixtures/a.js";
            obj.writeFile("a.js", fs.readFileSync(file, "utf8"), null, function(err) {
                assert.equal(err, null);
                obj.rename("a.js", "b.js", function(err) {
                    assert.equal(err, null);
                    obj.stat("b.js", function(err, stat) {
                        assert.equal(err, null);
                        assert.equal(fs.statSync(file).size, stat.size);
                        assert.ok(stat.isFile());
                        assert.ok(!stat.isDirectory());
                        obj.unlink("b.js", next);
                    });
                });
            });
        });
    },
    
    "test renaming non-existing file": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            obj.rename("youdonotexists.xxx", "b.js", function(err) {
                assert.equal(err, "Couldn't rename file \"/home/sshtest/youdonotexists.xxx\" to \"/home/sshtest/b.js\": No such file or directory");
                next();
            });
        });
    },
    
    ">test chmod-ing new file": function(next) {
        var obj = this.obj  = new sftp({host: host, username: "sshtest", privateKey: prvkey}, function(err) {
            assert.equal(err, null);
            var file = __dirname + "/fixtures/a.js";
            obj.writeFile("a.js", fs.readFileSync(file, "utf8"), null, function(err) {
                assert.equal(err, null);
                obj.chmod("a.js", 0766, function(err) {
                    assert.equal(err, null);
                    obj.stat("a.js", function(err, stat) {
                        assert.equal(err, null);
                        assert.equal(stat.mode, 766);
                        assert.ok(stat.isFile());
                        assert.ok(!stat.isDirectory());
                        obj.unlink("a.js", next);
                    });
                });
            });
        });
    },
}

!module.parent && require("asyncjs").test.testcase(module.exports, "SFTP", 5000).exec();
