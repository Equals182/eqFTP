/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var os = require("os"),
        fs = require("fs"),
        assert = require("assert"),
        FTPClient = require("jsftp"),
        mkpath = require("mkpath"),
        
        debug = false,
        _domainManager,
        eqFTPconnections = [],
        listInterval = null;
        
    function normalizePath(input) {
        if (input !== undefined) {
            var tmp = input.replace(/\\+/g, '/');
            tmp = tmp.replace(/\/\/+/g, '/');
            return tmp;
        }
        return undefined;
    }

    function throwError(txt, log) {
        var err = (new Error()).stack;
        err = err.split("\n")[2].match(/:(\d+):\d+$/i);
        var error = "";
        if (err !== null && err[1] !== undefined) {
            error = err[1] + ": ";
        }
        if (log) {
            console.log("[eqFTP-ftpDomain]: " + error + txt);
        } else {
            console.error("[eqFTP-ftpDomain]: " + error + txt);
        }
    }
    
    function cmdCrypto(params) {
        var crypto = require('crypto'),
            key = params.pass,
            cipher = crypto.createCipher('aes-256-cbc', key),
            decipher = crypto.createDecipher('aes-256-cbc', key);
        
        if (params.direction === 'to') {
            var encryptedPassword = cipher.update(params.text, 'utf8', 'base64');
            encryptedPassword = encryptedPassword + cipher.final('base64');
            return encryptedPassword;
        } else if (params.direction === 'from') {
            var decryptedPassword = decipher.update(params.text, 'base64', 'utf8');
            decryptedPassword = decryptedPassword + decipher.final('utf8');
            return decryptedPassword;
        }
    }
    
    function addConnections(params) {
        if (eqFTPconnections.length < 1) {
            eqFTPconnections = params.connections;
        } else {
            var tmpSavedConnections = eqFTPconnections;
            eqFTPconnections = params.connections;
            eqFTPconnections.forEach(function (element, index, array) {
                var old = tmpSavedConnections[index];
                eqFTPconnections[index].listeners = old.listeners;
                eqFTPconnections[index].client = old.client;
                if (
                    element.server === old.server &&
                    element.username === old.username &&
                    element.password === old.password &&
                    element.port === old.port && 
                    element.remotepath === old.remotepath
                ) {
                    eqFTPconnections[index].client = old.client;
                    eqFTPconnections[index].processQueuePaused = old.processQueuePaused;
                    eqFTPconnections[index].queue = old.queue;
                    eqFTPconnections[index].remoteRoot = old.remoteRoot;
                } else {
                    eqFTPconnections[index].processQueuePaused = false;
                    eqFTPconnections[index].queue = [];
                    eqFTPconnections[index].remoteRoot = false;
                    if (eqFTPconnections[index].client) {
                        reconnect({
                            connectionID: index,
                            callback: function(result) {
                                if (result) {
                                    _domainManager.emitEvent("eqFTP", "otherEvents", {event: "refreshFileTree", id: index});
                                }
                            }
                        });
                    } else {
                        _domainManager.emitEvent("eqFTP", "otherEvents", {event: "refreshFileTree", id: index});
                    }
                }
            });
        }
    }
    
    function updateSettings(params) {
        debug = params.debug || false;
    }
    
    var progressTotalsize = 0,
        progressReaded = 0;
    function connect(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            if (!eqFTPconnections[params.connectionID].client) {
                var useList = false;
                if (eqFTPconnections[params.connectionID].useList) {
                    useList = true;
                }
                if (!eqFTPconnections[params.connectionID].listeners) {
                    eqFTPconnections[params.connectionID].listeners = {};
                }
                throwError("Connecting...", true);
                eqFTPconnections[params.connectionID].client = new FTPClient({
                    host: eqFTPconnections[params.connectionID].server,
                    user: eqFTPconnections[params.connectionID].username,
                    pass: eqFTPconnections[params.connectionID].password,
                    port: eqFTPconnections[params.connectionID].port,
                    useList: useList,
                    debugMode: debug
                });
                
                eqFTPconnections[params.connectionID].listeners.error = function (err) {
                    throwError(err);
                    _domainManager.emitEvent("eqFTP", "otherEvents", {event: "connectError", err: err});
                    if (params.callback) {
                        params.callback(false);
                    }
                    disconnect({
                        connectionID: params.connectionID
                    });
                    return false;
                }
                
                if (eqFTPconnections[params.connectionID].client) {
                    eqFTPconnections[params.connectionID].client.on('error', eqFTPconnections[params.connectionID].listeners.error);
                    
                    eqFTPconnections[params.connectionID].listeners.connect = function () {
                        throwError("Connected...", true);
                        if (eqFTPconnections[params.connectionID].client) {
                            eqFTPconnections[params.connectionID].client.auth(eqFTPconnections[params.connectionID].username, eqFTPconnections[params.connectionID].password, function (err, res) {
                                if (err) {
                                    throwError("connect: client can't auth. ConnectionID: " + params.connectionID);
                                    throwError(err);
                                    disconnect({
                                        connectionID: params.connectionID
                                    });
                                    _domainManager.emitEvent("eqFTP", "otherEvents", {event: "authError", err: err});
                                } else {
                                    if (eqFTPconnections[params.connectionID].keepAlive && eqFTPconnections[params.connectionID].keepAlive > 0) {
                                        eqFTPconnections[params.connectionID].client.keepAlive(eqFTPconnections[params.connectionID].keepAlive * 1000);
                                    }
                                    eqFTPconnections[params.connectionID].listeners.progress = function(data) {
                                        if (progressTotalsize !== false) {
                                            data.total = progressTotalsize;
                                        }
                                        if (data.total > 1000000) {
                                            if (progressTotalsize === false) {
                                                if (progressReaded === false) { progressReaded = 0; }
                                                progressReaded = progressReaded + data.chunksize;
                                                data.transferred = progressReaded;
                                            }
                                            _domainManager.emitEvent("eqFTP", "transferProgress", {data: data, element: eqFTPconnections[params.connectionID].currentElement});
                                        }
                                    }
                                    eqFTPconnections[params.connectionID].client.on('progress', eqFTPconnections[params.connectionID].listeners.progress);
                                    if (params.callback) {
                                        params.callback(true);
                                    }
                                }
                            });
                            if (debug) {
                                eqFTPconnections[params.connectionID].listeners.debug = function (eventType, data) {
                                    console.log('DEBUG: ', eventType);
                                    console.log(JSON.stringify(data, null, 2));
                                }
                                eqFTPconnections[params.connectionID].client.on('jsftp_debug', eqFTPconnections[params.connectionID].listeners.debug);
                            }
                            eqFTPconnections[params.connectionID].listeners.customError = function (data) {
                                throwError(JSON.stringify(data), true);
                                reconnect({
                                    connectionID: params.connectionID,
                                    callback: function(result) {
                                        if (result) {
                                            processQueue({
                                                connectionID: params.connectionID
                                            });
                                        }
                                    }
                                })
                            }
                            eqFTPconnections[params.connectionID].client.on('customError', eqFTPconnections[params.connectionID].listeners.customError);
                        }
                    }

                    eqFTPconnections[params.connectionID].client.on('connect', eqFTPconnections[params.connectionID].listeners.connect);
                }
            } else {
                if (params.callback) {
                    params.callback(true);
                }
            }
        } else {
            throwError("connect: ConnectionID is empty or there's no connection with this ID: " + params.connectionID);
            if (params.callback) {
                params.callback(false);
            }
        }
    }
    
    function disconnect(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            throwError("Disconnecting...", true);
            eqFTPconnections[params.connectionID].processQueuePaused = true;
            if (eqFTPconnections[params.connectionID].client) {
                if (eqFTPconnections[params.connectionID].listeners.connect) {
                    eqFTPconnections[params.connectionID].client.removeListener('connect', eqFTPconnections[params.connectionID].listeners.connect);
                    eqFTPconnections[params.connectionID].listeners.connect = null;
                }
                if (eqFTPconnections[params.connectionID].listeners.customError) {
                    eqFTPconnections[params.connectionID].client.removeListener('customError', eqFTPconnections[params.connectionID].listeners.customError);
                    eqFTPconnections[params.connectionID].listeners.customError = null;
                }
                if (eqFTPconnections[params.connectionID].listeners.error) {
                    eqFTPconnections[params.connectionID].client.removeListener('error', eqFTPconnections[params.connectionID].listeners.error);
                    eqFTPconnections[params.connectionID].listeners.error = null;
                }
                if (eqFTPconnections[params.connectionID].listeners.progress) {
                    eqFTPconnections[params.connectionID].client.removeListener('progress', eqFTPconnections[params.connectionID].listeners.progress);
                    eqFTPconnections[params.connectionID].listeners.progress = null;
                }
                if (eqFTPconnections[params.connectionID].listeners.debug) {
                    eqFTPconnections[params.connectionID].client.removeListener('jsftp_debug', eqFTPconnections[params.connectionID].listeners.debug);
                    eqFTPconnections[params.connectionID].listeners.debug = null;
                }
                eqFTPconnections[params.connectionID].client.raw.abor();
                eqFTPconnections[params.connectionID].client.raw.quit();
                eqFTPconnections[params.connectionID].client.destroy();
                eqFTPconnections[params.connectionID].client = undefined;
                if (params.clearQueue) {
                    eqFTPconnections[params.connectionID].queue = [];
                }
                throwError("Disonnected...", true);
                _domainManager.emitEvent("eqFTP", "otherEvents", {status: "disconnect", connectionID: params.connectionID});
                eqFTPconnections[params.connectionID].processQueuePaused = false;
                if (params.callback) {
                    params.callback(true);
                }
            } else {
                eqFTPconnections[params.connectionID].processQueuePaused = false;
                if (params.callback) {
                    params.callback(true);
                }
            }
        } else {
            if (params.callback) {
                params.callback(false);
            }
        }
    }
    
    function reconnect(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            disconnect({
                connectionID: params.connectionID,
                callback: function (result) {
                    if (result) {
                        connect({
                            connectionID: params.connectionID,
                            callback: params.callback
                        });
                    } else {
                        if (params.callback) {
                            params.callback(false);
                        }
                    }
                }
            });
        } else {
            if (params.callback) {
                params.callback(false);
            }
        }
    }
    
    function getPWD(params) {
        if (params.client && params.client !== null) {
            params.client.raw.pwd(null, function (err, data) {
                var path = data.text.match(/257\s"(.*?)"/i);
                if (!path[1] || path[1] === undefined) {
                    path = "/";
                } else {
                    path = path[1];
                }
                eqFTPconnections[params.connectionID].remoteRoot = path;
                if (params.callback) {
                    params.callback(path);
                }
            });
        } else {
            throwError("getPWD: client doesn't exist.");
            if (params.callback) {
                params.callback(false);
            }
        }
    }
    
    function getRemoteRoot(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            var root = eqFTPconnections[params.connectionID].remoteRoot;
            if (!root) {
                params.path = eqFTPconnections[params.connectionID].remotepath;
                params.client = eqFTPconnections[params.connectionID].client;
                if (params.path !== "'eqFTP'root'" && params.path !== "") {
                    if (params.client && params.client !== null) {
                        params.client.raw.cwd(params.path, function (err, data) {
                            if (err !== null || err) {
                                if (params.client && params.client !== null) {
                                    params.client.raw.cwd("/", function (err, data) {
                                        getPWD(params);
                                    });
                                } else {
                                    throwError("getRemoteRoot: client doesn't exist.");
                                    if (params.callback) {
                                        params.callback(false);
                                    }
                                }
                            } else {
                                getPWD(params);
                            }
                        });
                    } else {
                        throwError("getRemoteRoot: client doesn't exist.");
                        if (params.callback) {
                            params.callback(false);
                        }
                    }
                } else {
                    getPWD(params);
                }
            } else {
                if (params.callback) {
                    params.callback(root);
                }
            }
        }
    }
    
    function getAvailableCommands(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            if (!eqFTPconnections[params.connectionID].supportedCommands) {
                if (eqFTPconnections[params.connectionID].client) {
                    eqFTPconnections[params.connectionID].client.raw.help("", function (err, data) {
                        if (!err) {
                            var commandArray = data.text.split("\n");
                            commandArray.shift();
                            commandArray.pop();
                            var commandList = [];
                            commandArray.forEach(function (element, index, array) {
                                var command = element.match(/(\w+)\s+(?!\*)/ig);
                                if (command.length > 0) {
                                    command.forEach(function (element, index, array) {
                                        element = element.replace(/(\s+)/, '');
                                        commandList.push(element);
                                    });
                                }
                            });
                            eqFTPconnections[params.connectionID].supportedCommands = commandList;
                            if (params.callback) {
                                if (params.checkFor) {
                                    params.callback(eqFTPconnections[params.connectionID].supportedCommands.indexOf(params.checkFor));
                                } else {
                                    params.callback(eqFTPconnections[params.connectionID].supportedCommands);
                                }
                            }
                        } else {
                            throwError(err);
                            if (params.callback) {
                                params.callback(false);
                            }
                        }
                    });
                } else {
                    throwError("getAvailableCommands: client doesn't exist.");
                    if (params.callback) {
                        params.callback(false);
                    }
                }
            } else {
                if (params.callback) {
                    if (params.checkFor) {
                        params.callback(eqFTPconnections[params.connectionID].supportedCommands.indexOf(params.checkFor));
                    } else {
                        params.callback(eqFTPconnections[params.connectionID].supportedCommands);
                    }
                }
            }
        } else {
            throwError("getAvailableCommands: ConnectionID is empty or there's no connection with this ID.");
            if (params.callback) {
                params.callback(false);
            }
        }
    }
    
    function recursiveRemoteDirectoryCreation(params) {
        // pathArray,tmp_path,finalPath,i,client
        if (params.client !== null && params.client) {
            params.client.raw.cwd(params.remoteRoot, function (err, data) {
            });

            if (params.i === undefined) { params.i = 0; }
            if (params.tmp_path === undefined) { params.tmp_path = params.remoteRoot; }
            var entry = params.pathArray[params.i];
            if (entry === undefined) {
                params.finalPath = params.finalPath.replace(/(\/$)/gi, "");
                if (params.tmp_path === params.finalPath) {
                    throwError("Created directory structure on remote server.", true);
                    if (params.callback !== undefined) {
                        params.callback();
                    }
                    return true;
                } else {
                    return false;
                }
            }
            entry = entry.trim();
            if (entry !== "") {
                var tmp = normalizePath(params.tmp_path + "/" + entry);
                console.log('checking: ' + tmp + "/");
                if (params.client) {
                    params.client.ls(tmp + "/", function (err, result) {
                        if (err !== null) {
                            console.log('nopath: ' + tmp + "/");
                            if (params.client !== null && params.client) {
                                params.client.raw.cwd(params.tmp_path + "/", function (err, data) {
                                    if (err === null || !err) {
                                        if (params.client !== null && params.client) {
                                            params.client.raw.mkd(entry, function (err, data) {
                                                if (err === null || !err) {
                                                    params.tmp_path = tmp;
                                                    params.i++;
                                                    return recursiveRemoteDirectoryCreation(params);
                                                } else {
                                                    throwError("Can't create remote directory: " + tmp);
                                                    return false;
                                                }
                                            });
                                        } else {
                                            throwError("recursiveRemoteDirectoryCreation: client doesn't exist");
                                            return false;
                                        }
                                    } else {
                                        throwError("Can't get in directory: " + params.tmp_path);
                                        return false;
                                    }
                                });
                            } else {
                                throwError("recursiveRemoteDirectoryCreation: client doesn't exist");
                                return false;
                            }
                        } else {
                            params.tmp_path = tmp;
                            params.i++;
                            return recursiveRemoteDirectoryCreation(params);
                        }
                    });
                } else {
                    throwError("recursiveRemoteDirectoryCreation: client doesn't exist");
                    return false;
                }
            } else {
                params.i++;
                return recursiveRemoteDirectoryCreation(params);
            }
        } else {
            throwError("recursiveRemoteDirectoryCreation: client doesn't exist");
            return false;
        }
    }
    
    function getDirectory(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            connect({
                connectionID: params.connectionID,
                callback: function (result) {
                    if (result) {
                        if (eqFTPconnections[params.connectionID].client) {
                            eqFTPconnections[params.connectionID].client.ls(params.path, function (err, files) {
                                throwError("Got Directory: " + params.path, true);
                                if (params.callback) {
                                    if (eqFTPconnections[params.connectionID].useList) {
                                        listInterval = setInterval(function() {
                                            params.callback(err, files);
                                            clearInterval(listInterval);
                                        }, 500);
                                    } else {
                                        params.callback(err, files);
                                    }
                                }
                            });
                        } else {
                            if (params.callback) {
                                params.callback("getDirectory callback: client doesn't exist", false);
                            }
                        }
                    }
                }
            });
        } else {
            throwError("getDirectory: ConnectionID is empty or there's no connection with this ID.");
        }
    }
    
    /**
        This function processing file's uploading/downloading
        @param object connectionID {string}<br>direction {string} (download|upload)<br>root {string}<br>remotePath {string}<br>localPath {string}<br>callback {function}
    */
    function processFile(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            if (params.direction === "upload") {
                var remoteRoot = params.root,
                    path = normalizePath(remoteRoot + "/" + params.remotePath),
                    pathArray = params.remotePath.split('/');
                params.name = pathArray.pop();
				var dir = normalizePath(remoteRoot + "/" + pathArray.join("/"));
                
				eqFTPconnections[params.connectionID].currentElement.name = params.name;
                throwError("Trying to upload file: " + params.localPath + " to " + path, true);
                progressReaded = 0;
                progressTotalsize = false;
                connect({
                    connectionID: params.connectionID,
                    callback: function (result) {
                        if (result) {
                            if (eqFTPconnections[params.connectionID].client) {
                                eqFTPconnections[params.connectionID].client.ls(dir, function (err, result) {
                                    var doThis2 = function () {
                                        if (eqFTPconnections[params.connectionID].client) {
                                            eqFTPconnections[params.connectionID].client.put(params.localPath, path, function (hadErr) {
                                                if (!hadErr) {
                                                    throwError("File uploaded successfully!", true);
                                                    _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadComplete", element: eqFTPconnections[params.connectionID].currentElement});
                                                    if (params.callback) {
                                                        params.callback(true);
                                                    }
                                                } else {
                                                    throwError("There was an error uploading the file.");
                                                    throwError(hadErr);
													eqFTPconnections[params.connectionID].currentElement.status = hadErr.code;
                                                    _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadError", element: eqFTPconnections[params.connectionID].currentElement});
                                                    if (params.callback) {
                                                        params.callback(false);
                                                    }
                                                }
                                            });
                                        } else {
                                            throwError("processFile (upload) callback: client doesn't exist");
                                            _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadError", element: eqFTPconnections[params.connectionID].currentElement});
                                            if (params.callback) {
                                                params.callback(false);
                                            }
                                        }
                                    };
                                    if (err !== null) {
                                        throwError(err, true);
                                        if (err.code == 450) {
                                            recursiveRemoteDirectoryCreation({
                                                pathArray: pathArray,
                                                finalPath: dir,
                                                remoteRoot: remoteRoot,
                                                client: eqFTPconnections[params.connectionID].client,
                                                callback: function () {
                                                    doThis2();
                                                }
                                            });
                                        }
                                    } else if (!err) {
                                        doThis2();
                                    }
                                });
                            } else {
                                throwError("processFile (upload): client doesn't exist");
                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadError", element: eqFTPconnections[params.connectionID].currentElement});
                                if (params.callback) {
                                    params.callback(false);
                                }
                            }
                        } else {
                            throwError("processFile (upload): can't connect to server");
                            _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadError", element: eqFTPconnections[params.connectionID].currentElement});
                            if (params.callback) {
                                params.callback(false);
                            }
                        }
                    }
                });
            } else if (params.direction === "download") {
                var path = normalizePath(params.root + params.remotePath);
                throwError("Trying to download file: " + path + " to " + params.localPath + params.name, true);
                mkpath(params.localPath, function (err) {
                    if (err) {
                        throwError(err);
                        if (params.callback) {
                            params.callback(false);
                        }
                    } else {
                        throwError("Directory structure " + params.localPath + " created.", true);
                        connect({
                            connectionID: params.connectionID,
                            callback: function (result) {
                                if (result) {
                                    if (eqFTPconnections[params.connectionID].client) {
                                        eqFTPconnections[params.connectionID].client.ls(path + "*", function (err, files) {
                                            if (files !== undefined && err === null && files.length > 0 && files[0] !== undefined) {
                                                progressTotalsize = files[0].size;
                                                progressReaded = false;
                                                path = files[0].name;
                                                var pathArray = path.split("/");
                                                params.name = pathArray.pop();
												eqFTPconnections[params.connectionID].currentElement.name = params.name;
                                                if (progressTotalsize > 0) {
                                                    if (eqFTPconnections[params.connectionID].client) {
                                                        eqFTPconnections[params.connectionID].client.get(path, params.localPath + params.name, function (hadErr) {
                                                            if (hadErr && hadErr!=null) {
                                                                eqFTPconnections[params.connectionID].currentElement.status = hadErr.code;
                                                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadError", element: eqFTPconnections[params.connectionID].currentElement});
                                                                throwError("There was an error downloading the file.");
                                                                throwError(hadErr);
                                                                if (params.callback) {
																	if (eqFTPconnections[params.connectionID].currentElement.status == "Cancelled") {
																		var i = setInterval(function() {
                                                                    		params.callback(false);
																			clearInterval(i);
																		}, 1000);
																	} else {
                                                                    	params.callback(false);
																	}
                                                                }
                                                            } else {
                                                                throwError("File downloaded successfully!", true);
                                                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: 'downloadComplete', element: eqFTPconnections[params.connectionID].currentElement});
                                                                if (params.callback) {
																	if (eqFTPconnections[params.connectionID].currentElement.status == "Cancelled") {
																		var i = setInterval(function() {
                                                                    		params.callback(true);
																			clearInterval(i);
																		}, 1000);
																	} else {
                                                                    	params.callback(true);
																	}
                                                                }
                                                            }
                                                        });
                                                    } else {
                                                        _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadError", element: eqFTPconnections[params.connectionID].currentElement});
                                                        throwError("processFile (download): can't connect to server");
                                                        if (params.callback) {
                                                            params.callback(false);
                                                        }
                                                    }
                                                } else {
                                                    _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadFilesize0", element: eqFTPconnections[params.connectionID].currentElement});
                                                    throwError("This file so empty I can't even download it. (Filesize=0)");
                                                    if (params.callback) {
                                                        params.callback(false);
                                                    }
                                                }
                                            } else {
                                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadError", element: eqFTPconnections[params.connectionID].currentElement});
                                                throwError("There was an error downloading the file.");
                                                throwError(err);
                                                if (params.callback) {
                                                    params.callback(false);
                                                }
                                            }
                                        });
                                    } else {
                                        _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadError", element: eqFTPconnections[params.connectionID].currentElement});
                                        throwError("processFile (download): can't connect to server");
                                        if (params.callback) {
                                            params.callback(false);
                                        }
                                    }
                                } else {
                                    if (params.callback) {
                                        params.callback(false);
                                    }
                                }
                            }
                        });
                    }
                });
            } else {
                if (params.callback) {
                    params.callback(false);
                }
            }
        }
        return false;
    }
    
    /**
        Starting Queue (recursive)
        @param object connectionID {string}<br>callback {function}
        @return none
    */
    function processQueue(params) {
        if (!eqFTPconnections[params.connectionID].processQueuePaused) {
            if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                if (eqFTPconnections[params.connectionID].queue !== undefined && eqFTPconnections[params.connectionID].queue.length > 0) {
                    if (!eqFTPconnections[params.connectionID].busy) {
                        var queuer = eqFTPconnections[params.connectionID].queue.shift();
						eqFTPconnections[params.connectionID].currentElement = queuer;
                        eqFTPconnections[params.connectionID].busy = true;
                        connect({
                            connectionID: params.connectionID,
                            callback: function (result) {
                                if (result) {
                                    getRemoteRoot({
                                        connectionID: params.connectionID,
                                        callback: function (root) {
                                            if (root) {
                                                if (queuer.type === "folder" || queuer.type === "folderRecursive") {
                                                    if (queuer.path === "'eqFTP'root'") {
                                                        queuer.path = "";
                                                    }
                                                    var path = normalizePath(root + "/" + queuer.path);
                                                    getDirectory({
                                                        connectionID: params.connectionID,
                                                        path: path,
                                                        callback: function (err, contents) {
                                                            eqFTPconnections[params.connectionID].busy = false;
                                                            if (!err) {
                                                                if (queuer.type === "folderRecursive") {
                                                                    _domainManager.emitEvent("eqFTP", "getDirectory", {
                                                                        err: err,
                                                                        files: contents,
                                                                        path: queuer.path,
                                                                        filesToQueue: queuer.filesToQueue,
                                                                        connectionID: params.connectionID
                                                                    });
                                                                    contents.forEach(function (element, index, array) {
                                                                        if (element.type === 1) {
                                                                            eqFTPconnections[params.connectionID].queue.unshift({
                                                                                type: "folderRecursive",
                                                                                path: queuer.path + "/" + element.name,
                                                                                connectionID: params.connectionID,
                                                                                filesToQueue: queuer.filesToQueue
                                                                            });
                                                                        }
                                                                    });
                                                                } else {
                                                                    _domainManager.emitEvent("eqFTP", "getDirectory", {err: err, files: contents, path: queuer.path, connectionID: params.connectionID});
                                                                }
                                                            } else {
                                                                throwError(err);
                                                            }
                                                            processQueue({
                                                                connectionID: params.connectionID,
                                                                callback: params.callback
                                                            });
                                                        }
                                                    });
                                                } else if (queuer.type === "file") {
                                                    processFile({
                                                        connectionID: params.connectionID,
                                                        direction: queuer.direction,
                                                        root: root,
                                                        remotePath: queuer.remotePath,
                                                        localPath: queuer.localPath,
                                                        name: queuer.name,
                                                        openAfter: queuer.openAfter,
                                                        id: queuer.id,
                                                        callback: function (result) {
                                                            eqFTPconnections[params.connectionID].busy = false;
                                                            if (!result) {
                                                                reconnect({
                                                                    connectionID: params.connectionID,
                                                                    callback: function (result) {
                                                                        if (result) {
                                                                            processQueue({
                                                                                connectionID: params.connectionID,
                                                                                callback: params.callback
                                                                            });
                                                                        }
                                                                    }
                                                                });
                                                            } else {
                                                                processQueue({
                                                                    connectionID: params.connectionID,
                                                                    callback: params.callback
                                                                });
                                                            }
                                                        }
                                                    });
                                                }
                                            } else {
                                                eqFTPconnections[params.connectionID].busy = false;
                                                throwError("Can't get folder. getRemoteRoot returned false");
                                                if (params.callback) {
                                                    params.callback(false);
                                                }
                                            }
                                        }
                                    });
                                } else {
                                    throwError("Can't connect to server. ConnectionID: " + params.connectionID);
                                }
                            }
                        });
                    }
                } else {
                    if (!eqFTPconnections[params.connectionID].keepAlive || eqFTPconnections[params.connectionID].keepAlive < 1) {
                        disconnect({
                            connectionID: params.connectionID,
                        });
                    }
                    throwError("Queue is empty", true);
                    _domainManager.emitEvent("eqFTP", "queueEvent", {status: "queueDone"});
                }
            } else {
                throwError("processQueue: ConnectionID is empty or there's no connection with this ID.");
                if (params.callback) {
                    params.callback(false);
                }
            }
        }
    }
    
    /**
        Add file or folder to queue
        @param object connectionID {string}<br>type {string} ("folder"|"folderRecursive"|"file")<br>callback {function}
        @return none
    */
    function addToQueue(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            eqFTPconnections[params.connectionID].processQueuePaused = true;
            if (!eqFTPconnections[params.connectionID].queue) {
                eqFTPconnections[params.connectionID].queue = [];
            }
            if (params.type === "folder" || params.type === "folderRecursive") {
                eqFTPconnections[params.connectionID].queue.unshift(params);
                var foldersPaths = [];
                eqFTPconnections[params.connectionID].queue.forEach(function (element, index, array) {
                    if (element.type === "folder" || element.type === "folderRecursive") {
                        foldersPaths.push(element);
                        eqFTPconnections[params.connectionID].queue.splice(index, 1);
                    }
                });
                eqFTPconnections[params.connectionID].queue = foldersPaths.concat(eqFTPconnections[params.connectionID].queue);
            } else if (params.type === "file") {
                eqFTPconnections[params.connectionID].queue.push(params);
            }
            eqFTPconnections[params.connectionID].processQueuePaused = false;
			if (debug) {
				throwError("Queue updated: " + JSON.stringify(eqFTPconnections[params.connectionID].queue), true);
			}
            processQueue({
                connectionID: params.connectionID,
                callback: params.callback
            });
        } else {
            if (params.callback) {
                params.callback(false);
            }
        }
    }
    
    function removeFromQueue(params) {
        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
            if (params.id === "pause") {
                eqFTPconnections[params.connectionID].processQueuePaused = true;
                eqFTPconnections[params.connectionID].queue.forEach(function (element, index, array) {
                    eqFTPconnections[params.connectionID].queue[index].queue = "paused";
                    eqFTPconnections[params.connectionID].queue[index].status = "Paused";
                });
                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "queuePaused", elements: eqFTPconnections[params.connectionID].queue});
                eqFTPconnections[params.connectionID].queue = [];
                eqFTPconnections[params.connectionID].processQueuePaused = false;
                processQueue({
                    connectionID: params.connectionID,
                    callback: params.callback
                });
            } else if (params.id === "all") {
                eqFTPconnections[params.connectionID].processQueuePaused = true;
                eqFTPconnections[params.connectionID].queue = [];
                eqFTPconnections[params.connectionID].processQueuePaused = false;
                processQueue({
                    connectionID: params.connectionID,
                    callback: params.callback
                });
            } else {
                eqFTPconnections[params.connectionID].processQueuePaused = true;
                eqFTPconnections[params.connectionID].queue.forEach(function (element, index, array) {
                    if (element.id === params.id) {
                        eqFTPconnections[params.connectionID].queue.splice(index, 1);
                        _domainManager.emitEvent("eqFTP", "queueEvent", {status: "queuerRemoved", element: element});
                    }
                });
				if (eqFTPconnections[params.connectionID].currentElement.id == params.id) {
					eqFTPconnections[params.connectionID].currentElement.status = "Cancelled";
					if (eqFTPconnections[params.connectionID].client) {
						eqFTPconnections[params.connectionID].client.raw.abor();
					}
				}
                eqFTPconnections[params.connectionID].processQueuePaused = false;
                processQueue({
                    connectionID: params.connectionID,
                    callback: params.callback
                });
            }
        } else {
            if (params.callback) {
                params.callback(false);
            }
        }
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
    
    function init(DomainManager) {
        if (!DomainManager.hasDomain("eqFTP")) {
            DomainManager.registerDomain("eqFTP", {major: 0, minor: 1});
        }
        _domainManager = DomainManager;

        DomainManager.registerCommand(
            "eqFTP",
            "addConnections",
            addConnections,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "addToQueue",
            addToQueue,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "removeFromQueue",
            removeFromQueue,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "disconnect",
            disconnect,
            false
        );
                
        DomainManager.registerCommand(
            "eqFTP",
            "connect",
            connect,
            false
        );
                
        DomainManager.registerCommand(
            "eqFTP",
            "updateSettings",
            updateSettings,
            false
        );
        
        /* 
            OLD
        */
        
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
        	"getDirectory"
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
console.log('[eqFTP-ftpDomain] Loaded');
