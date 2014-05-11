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
        
    var globalRecursiveInterval;
    function getDirectoryRecursive(params) {
        if(params.files==undefined) { params.files = []; }
        params.client.ls(params.path, function (err, files) {
            if(files) {
                files.forEach(function(obj){
                    if(obj.type==0) {
                        params.files.push({
                            remotePath: params.path+"/"+obj.name,
                            connectionID: params.downloadParams.connectionID,
                            queue: params.downloadParams.queue,
                            direction: params.downloadParams.direction,
                            name: obj.name
                        });
                    }else if(obj.type==1) {
                        params.files.concat(getDirectoryRecursive({
                            path: params.path+"/"+obj.name,
                            files: params.files,
                            client: params.client,
                            callback: params.callback,
                            downloadParams: params.downloadParams
                        }));
                    }
                });
                if(params.callback!=undefined) {
                    params.callback(params.files);
                }
            }
            return params.files;
        });
    }

    function cmdGetDirectory(params) {
        var client = new FTPClient({
            host: params.connection.server,
            user: params.connection.username,
            pass: params.connection.password,
            port: params.connection.port
        });
        
        client.auth(params.connection.username, params.connection.password, function (err, res) {
            if (err) {
                console.error("[eqFTP-ftpDomain] There was an error with authorization while trying to get directory.");
                console.error(err);
                _domainManager.emitEvent("bracketsftp", "uploadResult", "autherror");
            } else {
                if(params.recursive) {
                    params.client = client;
                    params.callback = function(files) {
                        clearInterval(globalRecursiveInterval);
                        globalRecursiveInterval = setInterval(function() {
                            console.log('[eqFTP-ftpDomain] Got directory structure.');
                            _domainManager.emitEvent("bracketsftp", "getDirectoryRecursive", {err:err, files:files});
                            clearInterval(globalRecursiveInterval);
                        },2000);
                    }
                    getDirectoryRecursive(params);
                }else{
                    client.ls(params.path, function (err, files) {
                        var arrayString = JSON.stringify(files);
                        _domainManager.emitEvent("bracketsftp", "getDirectory", {err:err, files:[arrayString]});
                    });
                }
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
    
    function recursiveRemoteDirectoryCreation(params) {
        // pathArray,tmp_path,finalPath,i,client
        if(params.client!=null && params.client) {
            params.client.raw.cwd("/", function(err, data) {
            });

            if(params.i==undefined) { params.i = 0; }
            if(params.tmp_path==undefined) { params.tmp_path = ""; }
            var entry = params.pathArray[params.i];
            if(entry==undefined) {
                if(params.tmp_path == params.finalPath) {
                    if(params.callback!=undefined) {
                        console.log('[eqFTP-ftpDomain] Created directory structure on remote server.')
                        params.callback();
                    }
                    return true;
                }else{
                    return false;
                }
            }
            entry = entry.trim();
            if(entry!="") {
                var tmp = params.tmp_path + "/" + entry;
                console.log('checking: '+tmp+"/");
                params.client.ls(tmp+"/", function(err,result) {
                    if(err!=null) {
                        console.log('nopath: '+tmp+"/");
                        if(params.client!=null && params.client) {
                            params.client.raw.cwd(params.tmp_path+"/", function(err, data) {
                                if(err==null || !err) {
                                    if(params.client!=null && params.client) {
                                        params.client.raw.mkd(entry, function(err, data) {
                                            console.log(data);
                                            if(err==null || !err) {
                                                params.tmp_path = tmp;
                                                params.i++;
                                                return recursiveRemoteDirectoryCreation(params);
                                            }else{
                                                console.error("[eqFTP-ftpDomain] Can't create remote directory: "+tmp);
                                                return false;
                                            }
                                        });
                                    }
                                }else{
                                    console.error("[eqFTP-ftpDomain] Can't get in directory: "+params.tmp_path);
                                    return false;
                                }
                            });
                        }
                    }else{
                        params.tmp_path = tmp;
                        params.i++;
                        return recursiveRemoteDirectoryCreation(params);
                    }
                });
            }else{
                params.i++;
                return recursiveRemoteDirectoryCreation(params);
            }
        }
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
    
    var lastConnectionID = null,
        queueClient = null,
        queuePaused = false,
        queue = [];
    var progressReaded = false,
        progressTotalsize = false;
    
    function cmdhandleQueue(elem) {
        console.log('[eqFTP-ftpDomain] Got cmdhandleQueue Command');
        
        if(queue.length>0 && queuePaused==false) {
            if(elem==undefined) {
                var el = queue.shift();
            }else{
                var el = elem;
            }
            var doThis = function(el) {
                if(el.direction=="upload") {
                    console.log("[eqFTP-ftpDomain] Trying to upload file: "+el.localPath+" to "+el.remotePath);
                    progressReaded = 0;
                    progressTotalsize = false;
                    if(queueClient!=null) {
                        queueClient.ls(el.remotePathDir, function(err,result) {
                            var doThis2 = function() {
                                if(queueClient!=null) {
                                    queueClient.put(el.localPath, el.remotePath, function(hadErr) {
                                        if (!hadErr) {
                                            console.log("[eqFTP-ftpDomain] File uploaded successfully!");
                                            console.error(hadErr);
                                            _domainManager.emitEvent("bracketsftp", "queueEvent", {status: "uploadComplete", element: el});
                                        }else{
                                            console.error('[eqFTP-ftpDomain] There was an error uploading the file.');
                                            console.error(hadErr);
                                            _domainManager.emitEvent("bracketsftp", "queueEvent", {status: "uploadError", element: el});
                                            queueClient.raw.quit();
                                            queueClient=null;
                                        }
                                        cmdhandleQueue();
                                    });

                                }
                            }
                            if(err!=null) {
                                console.error(err);
                                if(err.code == 450) {
                                    var pathArray = el.remotePathDir.split('/');
                                    recursiveRemoteDirectoryCreation({
                                        pathArray: pathArray,
                                        finalPath: el.remotePathDir,
                                        client: queueClient,
                                        callback: function() {
                                            doThis2();
                                        }
                                    });
                                }
                            }else if(!err) {
                                doThis2();
                            }
                        });
                    }
                    
                }else if(el.direction=="download") {
                    console.log("[eqFTP-ftpDomain] Trying to download file: "+el.remotePath+" to "+el.localPath+el.name);
                    mkpath(el.localPath, function (err) {
                        if (err) {
                            console.error(err);
                            cmdhandleQueue();
                        }else{
                            console.log('[eqFTP-ftpDomain] Directory structure '+el.localPath+' created');
                            if(queueClient!=null) {
                                queueClient.ls(el.remotePath+"*", function (err, files) {
                                    if(files!=undefined && err==null) {
                                        progressTotalsize = files[0].size;
                                        progressReaded = false;
                                        el.remotePath = files[0].name;
                                        var pathArray = el.remotePath.split("/");
                                        el.name = pathArray.pop();
                                        if(progressTotalsize>0) {
                                            if(queueClient!=null) {
                                                queueClient.get(el.remotePath, el.localPath+el.name, function(hadErr) {
                                                    if (hadErr) {
                                                        _domainManager.emitEvent("bracketsftp", "queueEvent", {status: "downloadError", element: el});
                                                        console.error('[eqFTP-ftpDomain] There was an error downloading the file.');
                                                        console.error(hadErr);
                                                        queueClient.raw.quit();
                                                        queueClient=null;
                                                    } else {
                                                        console.log('[eqFTP-ftpDomain] File downloaded successfully!');
                                                        _domainManager.emitEvent("bracketsftp", "queueEvent", {status: 'downloadComplete', element: el});
                                                    }
                                                    cmdhandleQueue();
                                                });
                                            }
                                        }else{
                                            _domainManager.emitEvent("bracketsftp", "queueEvent", {status: "downloadFilesize0", element: el});
                                            console.error("[eqFTP-ftpDomain] This file so empty I can't even download it. (Filesize=0)");
                                            queueClient.raw.quit();
                                            queueClient=null;
                                            cmdhandleQueue();
                                        }
                                    }else{
                                        _domainManager.emitEvent("bracketsftp", "queueEvent", {status: "downloadError", element: el});
                                        console.error('[eqFTP-ftpDomain] There was an error downloading the file.');
                                        console.error(err);
                                        queueClient.raw.quit();
                                        queueClient=null;
                                        cmdhandleQueue();
                                    }
                                });
                            }
                        }
                    });
                    
                }
            }
            if(lastConnectionID!=el.connectionID || queueClient==null) {
                if(queueClient!=null) {
                    queueClient.raw.quit();
                    queueClient=null;
                }
                queueClient = new FTPClient({
                    host: el.connection.server,
                    user: el.connection.username,
                    pass: el.connection.password,
                    port: el.connection.port
                });
                queueClient.auth(el.connection.username, el.connection.password, function (err, res) {
                    if (err) {
                        console.error("[eqFTP-ftpDomain] There was an error with authorization while trying to download file");
                        console.error(err);
                        _domainManager.emitEvent("bracketsftp", "queueEvent", {status: "authError", element: el});
                    } else {
                        lastConnectionID = el.connectionID;
                        doThis(el);
                        queueClient.on('progress', function(data) {
                            if(progressTotalsize==false) {
                                if(progressReaded==false) { progressReaded = 0; }
                                progressReaded = progressReaded + data.chunksize;
                                data.transferred = progressReaded;
                            }
                            if(progressTotalsize!=false) {
                                data.total = progressTotalsize;
                            }
                            _domainManager.emitEvent("bracketsftp", "transferProgress", {data: data});
                        });
                    }
                });
            }else{
                doThis(el);
            }
        }else{
            console.log("[eqFTP-ftpDomain] Queue is empty or paused.");
            _domainManager.emitEvent("bracketsftp", "queueEvent", {status: "queueDone"});
            queueClient.raw.quit();
            queueClient=null; 
        }
    }
    
    function cmdQueueControl(params) {
        if(params.action==undefined || params.action=="add"){
            queue = queue.concat(params.array);
        }else if(params.action=="clear") {
            queue = [];
            if(queueClient!=null) {
                queueClient.raw.quit();
                queueClient=null;
            }
            console.log("[eqFTP-ftpDomain] Queue is cleared.");
        }else if(params.action=="pause") {
            queuePaused = params.pause;
        }
    }

    function init(DomainManager) {
        if (!DomainManager.hasDomain("bracketsftp")) {
            DomainManager.registerDomain("bracketsftp", {major: 0, minor: 1});
        }
        _domainManager = DomainManager;

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
        
        DomainManager.registerCommand(
            "bracketsftp",
            "handleQueue",
            cmdhandleQueue,
            false
        );
        
        DomainManager.registerCommand(
            "bracketsftp",
            "queueControl",
            cmdQueueControl,
            false
        );

        DomainManager.registerEvent(
            "bracketsftp",
            "connectError",
            "err"
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
            "transferProgress"
        );
        
        DomainManager.registerEvent(
            "bracketsftp",
            "getDirectoryRecursive"
        );
        
        DomainManager.registerEvent(
            "bracketsftp",
            "queueEvent"
        );
        
    }
    
    exports.init = init;
    
}());