/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var os = require("os");
    var fs = require("fs");
    var assert = require("assert");
    var FTPClient = require("jsftp");
    var mkpath = require("mkpath");
    
    var _domainManager;
    console.log('jsftp-ok');
    
    function cmdGetDirectory(filepath, ftpdetails) {
        var client = new FTPClient({
            host: ftpdetails.server,
            user: ftpdetails.username,
            pass: ftpdetails.password,
            port: ftpdetails.port
        });
        
        client.auth(ftpdetails.username, ftpdetails.password, function (err, res) {
            if (err) {
                console.error(err);
                _domainManager.emitEvent("bracketsftp", "uploadResult", "autherror");
            } else {
                client.ls(filepath, function (err, files) {
                    var arrayString = JSON.stringify(files);
                    _domainManager.emitEvent("bracketsftp", "getDirectory", [arrayString]);
                });
            }
        });    
    }
    
    function cmdGetDirectorySFTP(filepath, ftpdetails) {        
        var SFTPClient = require("node-sftp");
        var client = new SFTPClient({
            host: ftpdetails.server,
            username: ftpdetails.username,
            password: ftpdetails.password,
            port: ftpdetails.port            
        }, function (err) {            
            if(err){
                
            } else {
                client.readdir("/home/dearlcco", function(err, files) {
                    if(err){
                        client.disconnect();
                        return callback(err, null)
                    }
                    var arrayString = JSON.stringify({filesarray: files});
                    _domainManager.emitEvent("bracketsftp", "getDirectorySFTP", [arrayString]);    
                });
            }
        });        
    }
    
    function cmdUploadFileSFTP(filepath, filename, ftpdetails, patharray) {
        var SFTPClient = require("node-sftp");
        var client = new SFTPClient({
            host: ftpdetails.server,
            username: ftpdetails.username,
            password: ftpdetails.password,
            port: ftpdetails.port,
            home: "/home" + ftpdetails.remotepath
        }, function (err) {
            if (err) {
                _domainManager.emitEvent("bracketsftp", "uploadResult", "autherror");
            } else {
                
                var i = 0;
                var pathArrayString = ftpdetails.remotepath;
                
                for (i; i < (patharray.length - 1); i++) {
                    pathArrayString = pathArrayString + "/" + patharray[i];
                    client.mkdir(patharray[i], null, function (err) {
                        client.cd("/home" + pathArrayString, function (err) {
                            _domainManager.emitEvent("bracketsftp", "uploadResult", "changed directory");
                            client.pwd(function (err, path) {
                                _domainManager.emitEvent("bracketsftp", "uploadResult", "working directory: " + path);
                            });
                        });
                    });
                }
                
                client.pwd(function (err, path) {
                    _domainManager.emitEvent("bracketsftp", "uploadResult", "working directory: " + path);
                });
                _domainManager.emitEvent("bracketsftp", "uploadResult", "current directory: ");
                
                client.writeFile(filename, fs.readFileSync(filepath, "utf8"), null, function (err) {
                    if (err) {
                        _domainManager.emitEvent("bracketsftp", "uploadResult", "uploaderror");
                    } else {
                        client.stat(filename, function (err, stat) {
                            
                        });
                    }
                    client.disconnect(function (err) {
                        _domainManager.emitEvent("bracketsftp", "uploadResult", "complete");
                    });
                });
            }
        });
    }
    
    function cmdUploadFile2(localpath, remotepath, ftpdetails) {
        var client = new FTPClient({
            host: ftpdetails.server,
            user: ftpdetails.username,
            pass: ftpdetails.password,
            port: ftpdetails.port
        });
        
        client.auth(ftpdetails.username, ftpdetails.password, function (err, res) {
            if (err) {
                console.error(err);
                _domainManager.emitEvent("bracketsftp", "uploadResult", "autherror");
            } else {
                client.put(localpath, remotepath, function(hadError) {
                    if (!hadError) {
                        console.log("File transferred successfully!");
                        client.raw.quit();
                        _domainManager.emitEvent("bracketsftp", "uploadResult", "complete");
                    }else{
                        _domainManager.emitEvent("bracketsftp", "uploadResult", "uploaderror");
                        client.raw.quit();
                    }
                });
            }
        });
    }
    
    function cmdUploadFile(filepath, filename, ftpdetails, patharray) {
        var client = new FTPClient({
            host: ftpdetails.server,
            user: ftpdetails.username,
            pass: ftpdetails.password,
            port: ftpdetails.port
        });
        
        var streamData = fs.createReadStream(filepath);
        streamData.pause();
        
        client.auth(ftpdetails.username, ftpdetails.password, function (err, res) {
            if (err) {
                console.error(err);
                _domainManager.emitEvent("bracketsftp", "uploadResult", "autherror");
            } else {
                var i = 0;
                var pathArrayString = ftpdetails.remotepath;
                
                for (i; i < (patharray.length - 1); i++) {
                    pathArrayString = pathArrayString + "/" + patharray[i];
                    client.raw.mkd(pathArrayString, function (err, data) {
                        client.raw.cwd(pathArrayString, function (err, data) {
                            
                        });
                    });
                }
                
                client.getPutSocket(pathArrayString + "/" + filename, function (err, socket) {
                    if (err) {
                        _domainManager.emitEvent("bracketsftp", "uploadResult", "uploaderror");
                        client.raw.quit();
                    } else {
                        streamData.pipe(socket);
                        streamData.resume();
                        client.raw.quit();
                        _domainManager.emitEvent("bracketsftp", "uploadResult", "complete");
                    }
                });
                
            }
        });
    }

    
    function cmdDownloadFile(remotepath, localpath, filename, ftpdetails) {
        mkpath(localpath, function (err) {
            if (err) throw err;
            console.log('Directory structure '+localpath+' created');
        });
        var client = new FTPClient({
            host: ftpdetails.server,
            user: ftpdetails.username,
            pass: ftpdetails.password,
            port: ftpdetails.port
        });
        client.auth(ftpdetails.username, ftpdetails.password, function (err, res) {
            if (err) {
                console.error(err);
                _domainManager.emitEvent("bracketsftp", "getFileResult", "autherror");
            } else {
                client.get(remotepath, localpath+filename, function(hadErr) {
                    if (hadErr) {
                        _domainManager.emitEvent("bracketsftp", "getFileResult", {status:"downloaderror"});
                        console.error('There was an error retrieving the file.');
                        console.error(hadErr);
                    } else {
                        _domainManager.emitEvent("bracketsftp", "getFileResult", {status:'complete',file:localpath+filename});
                        console.log('File copied successfully!');
                    }
                    client.raw.quit();
                });
            }
        });
    }
    
    function cmdCrypto(params) {
        
        var crypto = require('crypto')
        , key = params.pass
        , cipher = crypto.createCipher('aes-256-cbc', key)
        , decipher = crypto.createDecipher('aes-256-cbc', key);
        
        if(params.direction == 'to') {
            var encryptedPassword = cipher.update(params.text, 'utf8', 'base64');
            encryptedPassword = encryptedPassword + cipher.final('base64');
            return encryptedPassword;
        }else if(params.direction == 'from') {
            var decryptedPassword = decipher.update(params.text, 'base64', 'utf8');
            decryptedPassword = decryptedPassword + decipher.final('utf8');
            return decryptedPassword;
        }
    }

    function init(DomainManager) {
        if (!DomainManager.hasDomain("bracketsftp")) {
            DomainManager.registerDomain("bracketsftp", {major: 0, minor: 1});
        }
        _domainManager = DomainManager;
        
        DomainManager.registerCommand(
            "bracketsftp",
            "uploadFile",
            cmdUploadFile2,
            false
        );
        
        DomainManager.registerCommand(
            "bracketsftp",
            "getFile",
            cmdDownloadFile,
            false
        );
        
        DomainManager.registerCommand(
            "bracketsftp",
            "getDirectory",
            cmdGetDirectory,
            false
        );
        
        DomainManager.registerCommand(
            "bracketsftp",
            "getDirectorySFTP",
            cmdGetDirectorySFTP,
            false
        );
        
        DomainManager.registerCommand(
            "bracketsftp",
            "uploadFileSFTP",
            cmdUploadFileSFTP,
            false
        );
        
        DomainManager.registerCommand(
            "bracketsftp",
            "eqFTPcrypto",
            cmdCrypto,
            false
        );
        
        DomainManager.registerEvent(
            "bracketsftp",
            "uploadResult",
            "result"
        );
        
        DomainManager.registerEvent(
            "bracketsftp",
            "getDirectorySFTP",
            [
        		{
        			name: "path",
        			type: "string",
        			description: "path for returned files"
        		},
        		{
        			name: "files",
        			type: "string",
        			description: "files in path"
        		}        			
        	]
        );
        
        DomainManager.registerEvent(
        	"bracketsftp",
        	"getDirectory",
        	[
        		{
        			name: "path",
        			type: "string",
        			description: "path for returned files"
        		},
        		{
        			name: "files",
        			type: "string",
        			description: "files in path"
        		}        			
        	]
        );
        
        DomainManager.registerEvent(
            "bracketsftp",
            "getFileResult",
            [
        		{
        			name: "path",
        			type: "string",
        			description: "path for returned files"
        		},
        		{
        			name: "files",
        			type: "string",
        			description: "files in path"
        		}        			
        	]
        );
        
    }
    
    exports.init = init;
    
}());