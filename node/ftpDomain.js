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
        
    function normalizePath(input) {
        if(input != undefined) {
            var tmp = input.replace(/\\+/g,'/');
            tmp = tmp.replace(/\/\/+/g,'/');
            return tmp;
        }
        return undefined;
    }
    
    var globalRecursiveInterval;
    function getDirectoryRecursive(params) {
        if(params.files==undefined) { params.files = []; }
        var curAbsPath = normalizePath(params.remoteRoot + "/" + params.path);
        params.client.ls(curAbsPath, function (err, files) {
            if(files) {
                files.forEach(function(obj){
                    if(obj.type==0) {
                        //File
                        params.files.push({
                            remotePath: params.path+"/"+obj.name,
                            connectionID: params.downloadParams.connectionID,
                            queue: params.downloadParams.queue,
                            direction: params.downloadParams.direction,
                            name: obj.name
                        });
                    }else if(obj.type==1) {
                        //Folder
                        params.files.concat(getDirectoryRecursive({
                            path: params.path+"/"+obj.name,
                            files: params.files,
                            remoteRoot: params.remoteRoot,
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
    
    function getPWD(params) {
        params.client.raw.pwd(null,function(err, data) {
            var path = data.text.match(/257\s"(.*?)"/i);
            if(!path[1] || path[1]==undefined) {
                path = "/";
            }else{
                path = path[1];
            }
            console.log("[eqFTP test] PWD data: "+data);
            console.log("[eqFTP test] PWD path extracted: "+path);
            if(params.callback) {
                params.callback(path);
            }
        });
    }
    
    function getRemoteRoot(params) {
        if(params.path!="'eqFTP'root'" || params.path!="") {
            params.client.raw.cwd(params.path, function(err, data) {
                if(err!=null || err) {
                    params.client.raw.cwd("/", function(err, data) {
                        getPWD(params);
                    });
                }else{
                    getPWD(params);
                }
            });
        }else{
            getPWD(params);
        }
    }

    function cmdGetDirectory(params) {
        var client = new FTPClient({
            host: params.connection.server,
            user: params.connection.username,
            pass: params.connection.password,
            port: params.connection.port
        });
        
        client.on('error', function(err) {
            console.error("[eqFTP-ftpDomain] "+err);
            _domainManager.emitEvent("eqFTP", "otherEvents", {event:"connectError", err:err});
            return false;
        });
        
        client.on('connect', function() {
            client.auth(params.connection.username, params.connection.password, function (err, res) {
                if (err) {
                    console.error("[eqFTP-ftpDomain] There was an error with authorization while trying to get directory.");
                    console.error("[eqFTP-ftpDomain] "+err);
                    _domainManager.emitEvent("eqFTP", "otherEvents", {event:"authError", err:err});
                } else {
                    if(params.recursive) {
                        params.client = client;
                        params.callback = function(files) {
                            clearInterval(globalRecursiveInterval);
                            globalRecursiveInterval = setInterval(function() {
                                console.log('[eqFTP-ftpDomain] Got directory structure.');
                                _domainManager.emitEvent("eqFTP", "getDirectoryRecursive", {err:err, files:files});
                                clearInterval(globalRecursiveInterval);
                            },2000);
                        }
                        getRemoteRoot({
                            path: params.remoteRoot,
                            client: client,
                            callback: function(path) {
                                params.remoteRoot = path;
                                getDirectoryRecursive(params);
                            }
                        });
                    }else{
                        var doThis = function(path) {
                            path = normalizePath(path+"/"+params.path);
                            client.ls(path, function (err, files) {
                                var arrayString = JSON.stringify(files);
                                console.log('[eqFTP] Got Directory: '+path);
                                _domainManager.emitEvent("eqFTP", "getDirectory", {err:err, files:[arrayString]});
                            });
                        }
                        getRemoteRoot({
                            path: params.remoteRoot,
                            client: client,
                            callback: doThis
                        });
                    }
                }
            });
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
                    _domainManager.emitEvent("eqFTP", "getDirectorySFTP", [arrayString]);    
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
                _domainManager.emitEvent("eqFTP", "uploadResult", "autherror");
            } else {
                
                var i = 0;
                var pathArrayString = ftpdetails.remotepath;
                
                for (i; i < (patharray.length - 1); i++) {
                    pathArrayString = pathArrayString + "/" + patharray[i];
                    client.mkdir(patharray[i], null, function (err) {
                        client.cd("/home" + pathArrayString, function (err) {
                            _domainManager.emitEvent("eqFTP", "uploadResult", "changed directory");
                            client.pwd(function (err, path) {
                                _domainManager.emitEvent("eqFTP", "uploadResult", "working directory: " + path);
                            });
                        });
                    });
                }
                
                client.pwd(function (err, path) {
                    _domainManager.emitEvent("eqFTP", "uploadResult", "working directory: " + path);
                });
                _domainManager.emitEvent("eqFTP", "uploadResult", "current directory: ");
                
                client.writeFile(filename, fs.readFileSync(filepath, "utf8"), null, function (err) {
                    if (err) {
                        _domainManager.emitEvent("eqFTP", "uploadResult", "uploaderror");
                    } else {
                        client.stat(filename, function (err, stat) {
                            
                        });
                    }
                    client.disconnect(function (err) {
                        _domainManager.emitEvent("eqFTP", "uploadResult", "complete");
                    });
                });
            }
        });
    }
    
    function recursiveRemoteDirectoryCreation(params) {
        // pathArray,tmp_path,finalPath,i,client
        if(params.client!=null && params.client) {
            params.client.raw.cwd(params.remoteRoot, function(err, data) {
            });

            if(params.i==undefined) { params.i = 0; }
            if(params.tmp_path==undefined) { params.tmp_path = params.remoteRoot; }
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
                var tmp = normalizePath(params.tmp_path + "/" + entry);
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
                    getRemoteRoot({
                        path: el.remoteRoot,
                        client: queueClient,
                        callback: function(path) {
                            var remoteRoot = path;
                            path = normalizePath(path+"/"+el.remotePath);
                            el.absRemotePath = path;
                            console.log("[eqFTP-ftpDomain] Trying to upload file: "+el.localPath+" to "+path);
                            progressReaded = 0;
                            progressTotalsize = false;
                            if(queueClient!=null) {
                                queueClient.ls(path, function(err,result) {
                                    var doThis2 = function() {
                                        if(queueClient!=null) {
                                            queueClient.put(el.localPath, path, function(hadErr) {
                                                if (!hadErr) {
                                                    console.log("[eqFTP-ftpDomain] File uploaded successfully!");
                                                    _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadComplete", element: el});
                                                }else{
                                                    console.error('[eqFTP-ftpDomain] There was an error uploading the file.');
                                                    console.error("[eqFTP-ftpDomain] "+hadErr);
                                                    _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadError", element: el});
                                                    if(queueClient!=null) {
                                                        queueClient.raw.abor();
                                                        queueClient.raw.quit();
                                                        queueClient=null;
                                                    }
                                                }
                                                cmdhandleQueue();
                                            });
                                        }
                                    }
                                    if(err!=null) {
                                        console.error("[eqFTP-ftpDomain] "+err);
                                        if(err.code == 450) {
                                            var pathArray = el.remotePath.split('/');
                                            pathArray.pop();
                                            recursiveRemoteDirectoryCreation({
                                                pathArray: pathArray,
                                                finalPath: normalizePath(remoteRoot+"/"+pathArray.join("/")),
                                                remoteRoot: remoteRoot,
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
                        }
                    });
                }else if(el.direction=="download") {
                    getRemoteRoot({
                        path: el.remoteRoot,
                        client: queueClient,
                        callback: function(path) {
                            path = normalizePath(path+el.remotePath);
                            el.absRemotePath = path;
                            console.log("[eqFTP-ftpDomain] Trying to download file: "+path+" to "+el.localPath+el.name);
                            mkpath(el.localPath, function (err) {
                                if (err) {
                                    console.error("[eqFTP-ftpDomain] "+err);
                                    cmdhandleQueue();
                                }else{
                                    console.log('[eqFTP-ftpDomain] Directory structure '+el.localPath+' created');
                                    if(queueClient!=null) {
                                        queueClient.ls(path+"*", function (err, files) {
                                            if(files!=undefined && err==null) {
                                                progressTotalsize = files[0].size;
                                                progressReaded = false;
                                                path = files[0].name;
                                                var pathArray = path.split("/");
                                                el.name = pathArray.pop();
                                                if(progressTotalsize>0) {
                                                    if(queueClient!=null) {
                                                        queueClient.get(path, el.localPath+el.name, function(hadErr) {
                                                            if (hadErr) {
                                                                el.status = hadErr;
                                                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadError", element: el});
                                                                console.error('[eqFTP-ftpDomain] There was an error downloading the file.');
                                                                console.error("[eqFTP-ftpDomain] "+hadErr);
                                                                if(queueClient!=null) {
                                                                    queueClient=null;
                                                                }
                                                            } else {
                                                                console.log('[eqFTP-ftpDomain] File downloaded successfully!');
                                                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: 'downloadComplete', element: el});
                                                            }
                                                            cmdhandleQueue();
                                                        });
                                                    }
                                                }else{
                                                    _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadFilesize0", element: el});
                                                    console.error("[eqFTP-ftpDomain] This file so empty I can't even download it. (Filesize=0)");
                                                    if(queueClient!=null) {
                                                        queueClient.raw.abor();
                                                        queueClient.raw.quit();
                                                        queueClient=null;
                                                    }
                                                    cmdhandleQueue();
                                                }
                                            }else{
                                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadError", element: el});
                                                console.error('[eqFTP-ftpDomain] There was an error downloading the file.');
                                                console.error("[eqFTP-ftpDomain] "+err);
                                                if(queueClient!=null) {
                                                    queueClient.raw.abor();
                                                    queueClient.raw.quit();
                                                    queueClient=null;
                                                }
                                                cmdhandleQueue();
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                    return false;
                }
            }
            if(lastConnectionID!=el.connectionID || queueClient==null) {
                if(queueClient!=null) {
                    queueClient.raw.abor();
                    queueClient.raw.quit();
                    queueClient=null;
                }
                queueClient = new FTPClient({
                    host: el.connection.server,
                    user: el.connection.username,
                    pass: el.connection.password,
                    port: el.connection.port
                });

                queueClient.on('error', function(err) {
                    console.error("[eqFTP-ftpDomain] "+err);
                    _domainManager.emitEvent("eqFTP", "queueEvent", {status: "connectError", element: el, err:err});
                    queueClient = null;
                    cmdhandleQueue();
                });
                
                queueClient.on('connect', function(){
                    queueClient.auth(el.connection.username, el.connection.password, function (err, res) {
                        if (err) {
                            console.error("[eqFTP-ftpDomain] There was an error with authorization while trying to download file");
                            console.error("[eqFTP-ftpDomain] "+err);
                            _domainManager.emitEvent("eqFTP", "queueEvent", {status: "authError", element: el});
                        } else {
                            lastConnectionID = el.connectionID;
                            doThis(el);
                            queueClient.on('progress', function(data) {
                                if(progressTotalsize!=false) {
                                    data.total = progressTotalsize;
                                }
                                if(data.total > 1000000) {
                                    if(progressTotalsize==false) {
                                        if(progressReaded==false) { progressReaded = 0; }
                                        progressReaded = progressReaded + data.chunksize;
                                        data.transferred = progressReaded;
                                    }
                                    _domainManager.emitEvent("eqFTP", "transferProgress", {data: data});
                                }
                            });
                        }
                    });
                });
            }else{
                doThis(el);
            }
        }else{
            console.log("[eqFTP-ftpDomain] Queue is empty or paused.");
            _domainManager.emitEvent("eqFTP", "queueEvent", {status: "queueDone"});
            if(queueClient!=null) {
                queueClient.raw.abor();
                queueClient.raw.quit();
                queueClient=null;
            }
        }
    }
    
    function cmdQueueControl(params) {
        if(params.action==undefined || params.action=="add"){
            queue = queue.concat(params.array);
        }else if(params.action=="clear") {
            queue = [];
            if(queueClient!=null) {
                queueClient.raw.abor();
                queueClient.raw.quit();
                queueClient=null;
            }
            console.log("[eqFTP-ftpDomain] Queue is cleared.");
        }else if(params.action=="pause") {
            queuePaused = params.pause;
            if(queueClient!=null) {
                queueClient.raw.abor();
                queueClient.raw.quit();
                queueClient=null;
            }
        }
    }

    function init(DomainManager) {
        if (!DomainManager.hasDomain("eqFTP")) {
            DomainManager.registerDomain("eqFTP", {major: 0, minor: 1});
        }
        _domainManager = DomainManager;

        DomainManager.registerCommand(
            "eqFTP",
            "getDirectory",
            cmdGetDirectory,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "getDirectorySFTP",
            cmdGetDirectorySFTP,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "uploadFileSFTP",
            cmdUploadFileSFTP,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "eqFTPcrypto",
            cmdCrypto,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "handleQueue",
            cmdhandleQueue,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "queueControl",
            cmdQueueControl,
            false
        );

        DomainManager.registerEvent(
            "eqFTP",
            "connectError",
            "err"
        );
        
        DomainManager.registerEvent(
            "eqFTP",
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
        	"eqFTP",
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
            "eqFTP",
            "transferProgress"
        );
        
        DomainManager.registerEvent(
            "eqFTP",
            "getDirectoryRecursive"
        );
        
        DomainManager.registerEvent(
            "eqFTP",
            "queueEvent"
        );
        
        DomainManager.registerEvent(
            "eqFTP",
            "otherEvents"
        );
        
    }
    
    exports.init = init;
    
}());