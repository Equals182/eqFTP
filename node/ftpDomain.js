/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var os = require("os"),
        fs = require("fs"),
        assert = require("assert"),
        FTPClient = require("jsftp"),
        SFTPClient = require("scp2"),
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
    
    function getAvailableCommands(params) {
        if (params.check && eqFTPconnections[params.connectionID].supportedCommands.indexOf(params.check) > -1) {
            return true;
        } else {
            return false;
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
                    element.protocol === old.protocol &&
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
                        _commands.connection.reconnect({
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
    
    var _commands = {
        connection: {
            /**
             * This command creates Client depend on SFTP or FTP
             * @param   {Object}  params Contains connectionID and callback parameters
             * @returns {Boolean} returns true/false or calling callback if exists
             */
            createClient: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if (!eqFTPconnections[params.connectionID].client) {
                        if (debug)
                            throwError("Connecting...", true);
                        if (!eqFTPconnections[params.connectionID].listeners)
                            eqFTPconnections[params.connectionID].listeners = {};

                        if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                            // SFTP
                            console.log(eqFTPconnections[params.connectionID]);
                        } else {
                            // FTP
                            eqFTPconnections[params.connectionID].client = new FTPClient({
                                host: eqFTPconnections[params.connectionID].server,
                                user: eqFTPconnections[params.connectionID].username,
                                pass: eqFTPconnections[params.connectionID].password,
                                port: eqFTPconnections[params.connectionID].port,
                                debugMode: debug
                            });
                        }
                        _commands.service.listeners({
                            connectionID: params.connectionID,
                            action: "add",
                            callback: params.callback
                        });
                    } else {
                        if (debug)
                            throwError("Client already exists for ID: "+params.connectionID, true);
                        if (params.callback)
                            params.callback(true);
                        else
                            return true;
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            connect: function(params) {
                if (debug)
                    throwError("Connecting to this ID: "+params.connectionID, true);
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    /*
                    1. Create Client
                    2. Add Listeners
                    3. Authorize
                    */
                    if (eqFTPconnections[params.connectionID].client === undefined) {
                        _commands.connection.createClient({
                            connectionID: params.connectionID,
                            callback: function(result) {
                                if (result) {
                                    _commands.service.auth({
                                        connectionID: params.connectionID,
                                        callback: function(result) {
                                            if (result) {
                                                _commands.service.getRemoteRoot({
                                                    connectionID: params.connectionID,
                                                    callback: params.callback
                                                });
                                            } else {
                                                if (params.callback)
                                                    params.callback(false);
                                                else
                                                    return false;
                                            }
                                        }
                                    });
                                } else {
                                    if (params.callback)
                                        params.callback(false);
                                    else
                                        return false;
                                }
                            }
                        });
                    } else {
                        if (debug)
                            throwError("Connection already exists for this ID: "+params.connectionID, true);
                        if (params.callback)
                            params.callback(true);
                        else
                            return false;
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            /**
             * Disconnects from server by connectionID
             * @param   {Object}  params Accepts connectionID, callback and clearQueue (bool)
             * @returns {Boolean} returns bool or runs callback
             */
            disconnect: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if (debug)
                        throwError("Disconnecting...", true);
                    eqFTPconnections[params.connectionID].processQueuePaused = true;
                    if (eqFTPconnections[params.connectionID].client) {
                        _commands.service.listeners({
                            connectionID: params.connectionID,
                            action: "remove",
                            callback: function(result) {
                                if (result) {
                                    var disconnected = false;
                                    if (!disconnected) {
                                        _commands.raw.abort({
                                            connectionID: params.connectionID,
                                            callback: function() {
                                                if (!disconnected) {
                                                    _commands.raw.quit({
                                                        connectionID: params.connectionID,
                                                        callback: function() {
                                                            if (!disconnected) {
                                                                _commands.service.destroy({
                                                                    connectionID: params.connectionID,
                                                                    callback: function() {
                                                                        eqFTPconnections[params.connectionID].client = undefined;
                                                                        disconnected = true;
                                                                        if (params.clearQueue)
                                                                            eqFTPconnections[params.connectionID].queue = [];
                                                                        if (debug)
                                                                            throwError("Disonnected...", true);
                                                                        _domainManager.emitEvent("eqFTP", "otherEvents", {event: "disconnect", connectionID: params.connectionID});
                                                                        eqFTPconnections[params.connectionID].processQueuePaused = false;
                                                                        if (params.callback)
                                                                            params.callback(true);
                                                                        else
                                                                            return true;
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                    var int = setInterval(function() {
                                        if (!disconnected) {
                                            _commands.service.destroy({
                                                connectionID: params.connectionID,
                                                callback: function() {
                                                    eqFTPconnections[params.connectionID].client = undefined;
                                                    disconnected = true;
                                                    if (params.clearQueue)
                                                        eqFTPconnections[params.connectionID].queue = [];
                                                    if (debug)
                                                        throwError("Disonnected...", true);
                                                    _domainManager.emitEvent("eqFTP", "otherEvents", {event: "disconnect", connectionID: params.connectionID});
                                                    eqFTPconnections[params.connectionID].processQueuePaused = false;
                                                    if (params.callback)
                                                        params.callback(true);
                                                    else
                                                        return true;
                                                }
                                            });
                                        }
                                        clearInterval(int);
                                    }, 1000);
                                }
                            }
                        });
                    } else {
                        eqFTPconnections[params.connectionID].processQueuePaused = false;
                        if (params.callback)
                            params.callback(true);
                        else
                            return true;
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            reconnect: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    _commands.connection.disconnect({
                        connectionID: params.connectionID,
                        callback: function (result) {
                            if (result) {
                                _commands.connection.connect({
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
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            }
        },
        service: {
            /**
             * This command adds and removes listeners
             * @param   {Object}  params Contains connectionID, callback and action parameters
             * @returns {Boolean} return boolean or runs callback
             */
            listeners: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if (params.action === 'remove') {
                        // Remove listeners from client
                        if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                            // SFTP
                            console.log(eqFTPconnections[params.connectionID]);
                        } else {
                            // FTP
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
                            if (params.callback)
                                params.callback(true);
                            else
                                return true;
                        }
                    } else {
                        // Add listeners to client
                        if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                            // SFTP
                            console.log(eqFTPconnections[params.connectionID]);
                        } else {
                            // FTP
                            // Error Listener
                            eqFTPconnections[params.connectionID].listeners.error = function (err) {
                                if (eqFTPconnections[params.connectionID].client) {
                                    if (debug) {
                                        throwError(JSON.stringify(err));
                                    }
                                    _domainManager.emitEvent("eqFTP", "otherEvents", {event: "connectError", err: err, connectionID: params.connectionID});
                                    eqFTPconnections[params.connectionID].client.destroy(function() {
                                        eqFTPconnections[params.connectionID].client = undefined;
                                    });
                                }
                                if (params.callback)
                                    params.callback(false);
                                else
                                    return false;
                            }
                            if (eqFTPconnections[params.connectionID].client)
                                eqFTPconnections[params.connectionID].client.on('connectError', eqFTPconnections[params.connectionID].listeners.error);
                            //Debug Listener
                            if (debug) {
                                eqFTPconnections[params.connectionID].listeners.debug = function (eventType, data) {
                                    console.log('DEBUG: ', eventType);
                                    console.log(JSON.stringify(data, null, 2));
                                }
                                if (eqFTPconnections[params.connectionID].client)
                                    eqFTPconnections[params.connectionID].client.on('jsftp_debug', eqFTPconnections[params.connectionID].listeners.debug);
                            }
                            //Custom Error Listener
                            eqFTPconnections[params.connectionID].listeners.customError = function (data) {
                                if (debug)
                                    throwError(JSON.stringify(data), true);
                                _commands.connection.reconnect({
                                    connectionID: params.connectionID,
                                    callback: function(result) {
                                        if (result) {
                                            _commands.file.process({
                                                connectionID: params.connectionID
                                            });
                                        }
                                    }
                                })
                            }
                            if (eqFTPconnections[params.connectionID].client)
                                eqFTPconnections[params.connectionID].client.on('customError', eqFTPconnections[params.connectionID].listeners.customError);
                            //Connect Listener
                            eqFTPconnections[params.connectionID].listeners.connect = function () {
                                _domainManager.emitEvent("eqFTP", "otherEvents", {event: "connect", connectionID: params.connectionID});
                                if (debug)
                                    throwError("Connected...", true);
                                if (params.callback)
                                    params.callback(true);
                                else
                                    return true;
                            }
                            if (eqFTPconnections[params.connectionID].client)
                                eqFTPconnections[params.connectionID].client.on('connect', eqFTPconnections[params.connectionID].listeners.connect);
                            //Progress Listener
                            eqFTPconnections[params.connectionID].listeners.progress = function(data) {
                                if (data.extr.progressTotalsize !== false) {
                                    data.total = data.extr.progressTotalsize;
                                }
                                if (data.total > 1000000) {
                                    if (data.extr.progressTotalsize === false) {
                                        if (data.extr.progressReaded === false) { data.extr.progressReaded = 0; }
                                        data.extr.progressReaded = data.extr.progressReaded + data.chunksize;
                                        data.transferred = data.extr.progressReaded;
                                    }
                                    _domainManager.emitEvent("eqFTP", "transferProgress", {data: data, element: eqFTPconnections[params.connectionID].currentElement});
                                }
                            }
                            eqFTPconnections[params.connectionID].client.on('progress', eqFTPconnections[params.connectionID].listeners.progress);
                        }
                        if (params.callback)
                            params.callback(true);
                        else
                            return true;
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            auth: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                        // SFTP
                        console.log(eqFTPconnections[params.connectionID]);
                    } else {
                        // FTP
                        if (!eqFTPconnections[params.connectionID].auth) {
                            eqFTPconnections[params.connectionID].client.auth({
                                user: eqFTPconnections[params.connectionID].username, 
                                pass: eqFTPconnections[params.connectionID].password,
                                callback: function (err, res) {
                                    if (err) {
                                        throwError("Can't authorize on connectionID: " + params.connectionID);
                                        throwError(err);
                                        _commands.connection.disconnect({
                                            connectionID: params.connectionID,
                                            clearQeue: true
                                        });
                                        _domainManager.emitEvent("eqFTP", "otherEvents", {event: "authError", err: err});
                                        if (params.callback)
                                            params.callback(false);
                                        else
                                            return false;
                                    } else {
                                        var commandArray = res.text.split("\n");
                                        commandArray.shift();
                                        commandArray.pop();
                                        var commandList = [];
                                        commandArray.forEach(function (element, index, array) {
                                            element = element.replace(/\w+\*.\s?/g, '');
                                            var command = element.match(/\s?(\w+)\s?(?!\*)/ig);
                                            if (command.length > 0) {
                                                command.forEach(function (element, index, array) {
                                                    element = element.replace(/(\s?)/g, '');
                                                    commandList.push(element);
                                                });
                                            }
                                        });
                                        eqFTPconnections[params.connectionID].supportedCommands = commandList;
                                        var useMLSD = getAvailableCommands({connectionID: params.connectionID, check: "MLSD"});
                                        if (useMLSD || eqFTPconnections[params.connectionID].useList)
                                            eqFTPconnections[params.connectionID].client.useCommand("MLSD");

                                        if (eqFTPconnections[params.connectionID].keepAlive && eqFTPconnections[params.connectionID].keepAlive > 0)
                                            eqFTPconnections[params.connectionID].client.keepAlive(eqFTPconnections[params.connectionID].keepAlive * 1000);
                                        eqFTPconnections[params.connectionID].auth = true;
                                        if (params.callback)
                                            params.callback(true);
                                        else
                                            return true;
                                    }
                                }
                            });
                        } else {
                            if (debug)
                                throwError("Client is already authorized for connection ID: "+params.connectionID, true);
                            if (params.callback)
                                params.callback(true);
                            else
                                return true;
                        }
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            destroy: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].client !== undefined) {
                    if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                        // SFTP
                        console.log(eqFTPconnections[params.connectionID]);
                    } else {
                        // FTP
                        eqFTPconnections[params.connectionID].client.destroy(params.callback);
                    }
                    eqFTPconnections[params.connectionID].auth = false;
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            /**
             * Recursive remote directory creation
             * @param   {Object}  params Accepts: connectionID, finalPath. Self creating: i, pathArray, tmpPath
             * @returns {Boolean} returns bool or runs callback
             */
            rrdc: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].client !== undefined && params.finalPath !== undefined) {
                    params.i = parseInt(params.i);
                    if (isNaN(params.i))
                        params.i = 0;
                    if (params.tmpPath === undefined) 
                        params.tmpPath = eqFTPconnections[params.connectionID].remoteRoot;
                    if (!params.pathArray)
                        params.pathArray = params.finalPath.split('/');
                    var step = params.pathArray[params.i];
                    if (step === undefined) {
                        params.finalPath = params.finalPath.replace(/(\/$)/gi, "");
                        if (params.tmpPath === normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.finalPath)) {
                            if (debug)
                                throwError("Directory structure on remote server successfully creaded.", true);
                            if (params.callback)
                                params.callback(true);
                            return true;
                        } else {
                            if (!params.pathArray[params.i + 1]) {
                                throwError("Can't create directory stucture on remote server. Final path and current path are not same.");
                                if (params.callback)
                                    params.callback(false);
                                return true;
                            } else {
                                return false;
                            }
                        }
                    } else {
                        step = step.trim();
                        if (step !== "") {
                            var tmp = normalizePath(params.tmpPath + "/" + step);
                            if (debug)
                                throwError('Checking directory: ' + tmp + "/", true);
                            
                            if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                // SFTP
                                console.log(eqFTPconnections[params.connectionID]);
                            } else {
                                // FTP
                                eqFTPconnections[params.connectionID].client.ls(tmp + "/", function (err, result) {
                                    if ( err && ( err.code == 450 || err.code == 550 || err.code == 553 )) {
                                        if (eqFTPconnections[params.connectionID].client !== null && eqFTPconnections[params.connectionID].client) {
                                            _commands.raw.cwd({
                                                connectionID: params.connectionID,
                                                path: params.tmpPath + "/",
                                                callback: function(result) {
                                                    if (result) {
                                                        _commands.raw.mkd({
                                                            connectionID: params.connectionID,
                                                            path: step,
                                                            callback: function(result) {
                                                                if (result) {
                                                                    params.tmpPath = tmp;
                                                                    params.i++;
                                                                    _commands.service.rrdc(params);
                                                                } else {
                                                                    if (params.callback)
                                                                        params.callback(false);
                                                                    return false;
                                                                }
                                                            }
                                                        });
                                                    } else {
                                                        if (params.callback)
                                                            params.callback(false);
                                                        return false;
                                                    }
                                                }
                                            });
                                        } else {
                                            throwError("_commands.service.rrdc: client doesn't exist");
                                            if (params.callback)
                                                params.callback(false);
                                            return false;
                                        }
                                    } else if (result) {
                                        params.tmpPath = tmp;
                                        params.i++;
                                        return _commands.service.rrdc(params);
                                    } else {
                                        throwError("_commands.service.rrdc: there's problem checking folder: " + JSON.stringify(err));
                                        if (params.callback)
                                            params.callback(false);
                                        return false;
                                    }
                                });
                            }
                        } else {
                            params.i++;
                            _commands.service.rrdc(params);
                        }
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            getRemoteRoot: function(params) {
                if (debug)
                    throwError("Getting remote root for this ID: "+params.connectionID, true);
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].client !== undefined) {
                    var root = eqFTPconnections[params.connectionID].remoteRoot;
                    if (!root) {
                        params.path = eqFTPconnections[params.connectionID].remotepath;
                        if (params.path !== "'eqFTP'root'" && params.path !== "") {
                            _commands.raw.cwd({
                                connectionID: params.connectionID,
                                path: params.path,
                                callback: function(result) {
                                    if (result) {
                                        _commands.raw.pwd({
                                            connectionID: params.connectionID,
                                            callback: function(path) {
                                                eqFTPconnections[params.connectionID].remoteRoot = path;
                                                if (params.callback)
                                                    params.callback(path);
                                                else
                                                    return path;
                                            }
                                        });
                                    } else {
                                        if (params.callback)
                                            params.callback(false);
                                        else
                                            return false;
                                    }
                                }
                            });
                        } else {
                            _commands.raw.pwd({
                                connectionID: params.connectionID,
                                callback: function(path) {
                                    eqFTPconnections[params.connectionID].remoteRoot = path;
                                    if (params.callback)
                                        params.callback(path);
                                    else
                                        return path;
                                }
                            });
                        }
                    } else {
                        if (params.callback)
                            params.callback(root);
                        else
                            return root;
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            /**
             * Retrieves remote path (file/folder) and returns error & file's/folder's data
             * @param   {Object}  params Accepts connectionID, path, callback
             * @returns {Boolean} returns bool or calls callback
             */
            getPath: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].client !== undefined && params.path !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    console.log(eqFTPconnections[params.connectionID]);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].client.ls(params.path, function (err, files) {
                                        if (debug)
                                            throwError("Got Directory: " + params.path, true);
                                        if (params.callback)
                                            params.callback(err, files);
                                    });
                                }
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: " + params.connectionID + ". Or you forgot to pass path.");
                    if (params.callback)
                        params.callback(true, false);
                    else
                        return false;
                }
            }
        },
        raw: {
            abort: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    console.log(eqFTPconnections[params.connectionID]);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].client.raw({command: "abor", callback: params.callback});
                                }
                            } else {
                                if (params.callback)
                                    params.callback(false);
                                return false;
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            quit: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    console.log(eqFTPconnections[params.connectionID]);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].client.raw({command: "quit", callback: params.callback});
                                }
                            } else {
                                if (params.callback)
                                    params.callback(false);
                                return false;
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            /**
             * Returns path to current folder
             * @param   {Object}  params Accepts connectionID and callback
             * @returns {Boolean} returns path or runs callback
             */
            pwd: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    console.log(eqFTPconnections[params.connectionID]);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].client.raw({
                                        command: "pwd",
                                        callback: function (err, data) {
                                            var path = data.text.match(/257\s"(.*?)"/i);
                                            if (!path[1] || path[1] === undefined) {
                                                path = "/";
                                            } else {
                                                path = path[1];
                                            }
                                            if (params.callback)
                                                params.callback(path);
                                            else
                                                return path;
                                        }
                                    });
                                }
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            /**
             * Changes current remote folder
             * @param   {Object}  params Accepts connectionID, callback and path
             * @returns {Boolean} returns bool or runs callback
             */
            cwd: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && params.path !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    console.log(eqFTPconnections[params.connectionID]);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].client.raw({
                                        command: "cwd",
                                        arguments: [params.path], 
                                        callback: function (err, data) {
                                            if (err !== null && err) {
                                                //If there's an error
                                                if (params.path !== "/") {
                                                    throwError("Can't get in directory: " + params.tmp_path + ". Trying to get in /");
                                                    _commands.raw.cwd({
                                                        connectionID: params.connectionID,
                                                        path: "/",
                                                        callback: params.callback
                                                    });
                                                } else {
                                                    throwError("Can't get in directory: " + params.tmp_path + ". Trying to get in /");
                                                    if (params.callback)
                                                        params.callback(false);
                                                }
                                            } else {
                                                if (params.callback)
                                                    params.callback(params.path);
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            /**
             * Creates remote folder
             * @param   {Object}  params Accepts connectionID, callback and path
             * @returns {Boolean} returns bool or runs callback
             */
            mkd: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && params.path !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    console.log(eqFTPconnections[params.connectionID]);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].client.raw({
                                        command: "mkd",
                                        arguments: [params.path], 
                                        callback: function (err, data) {
                                            if (err === null || !err) {
                                                if (params.callback)
                                                    params.callback(true);
                                                return true;
                                            } else {
                                                throwError("Can't create remote directory: " + err + " " + JSON.stringify(data) + " : " + params.path);
                                                if (params.callback)
                                                    params.callback(false);
                                                return false;
                                            }
                                        }
                                    });
                                }
                            } else {
                                if (params.callback)
                                    params.callback(false);
                                return false;
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            rmd: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && params.path !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    console.log(eqFTPconnections[params.connectionID]);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].client.raw({
                                        command: "RMD",
                                        arguments: [normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path)],
                                        callback: function(err, data) {
                                            if (eqFTPconnections[params.connectionID].pendingDelete.length > 0) {
                                                var tmp = [];
                                                eqFTPconnections[params.connectionID].pendingDelete.forEach(function(element, index, array) {
                                                    if (element.path !== params.path) {
                                                        tmp.push(element);
                                                    }
                                                });
                                                eqFTPconnections[params.connectionID].pendingDelete = tmp;
                                            }
                                            if (err) {
                                                _domainManager.emitEvent("eqFTP", "otherEvents", {event: "delete", files: {path: params.path, connectionID: params.connectionID}, err: err, data: data});
                                                if (params.callback)
                                                    params.callback(false);
                                            } else {
                                                _domainManager.emitEvent("eqFTP", "otherEvents", {event: "delete", files: {path: params.path, connectionID: params.connectionID}, err: err, data: data});
                                                if (params.callback)
                                                    params.callback(true);
                                            }
                                        }
                                    });
                                }
                            } else {
                                if (params.callback)
                                    params.callback(false);
                                return false;
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            dele: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && params.path !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    console.log(eqFTPconnections[params.connectionID]);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].client.raw({
                                        command: "DELE",
                                        arguments: [normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path)],
                                        callback: function(err, data) {
                                            if (err) {
                                                _domainManager.emitEvent("eqFTP", "otherEvents", {event: "delete", files: {path: params.path, connectionID: params.connectionID}, err: err, data: data});
                                                if (params.callback)
                                                    params.callback(false);
                                            } else {
                                                _domainManager.emitEvent("eqFTP", "otherEvents", {event: "delete", files: {path: params.path, connectionID: params.connectionID}, err: err, data: data});
                                                if (params.callback)
                                                    params.callback(false);
                                            }
                                        }
                                    });
                                }
                            } else {
                                if (params.callback)
                                    params.callback(false);
                                return false;
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            }
        },
        queue: {
            add: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    eqFTPconnections[params.connectionID].processQueuePaused = true;
                    if (!eqFTPconnections[params.connectionID].queue)
                        eqFTPconnections[params.connectionID].queue = [];

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
                    if (debug)
                        throwError("Queue updated: " + JSON.stringify(eqFTPconnections[params.connectionID].queue), true);
                    _commands.queue.process({
                        connectionID: params.connectionID,
                        callback: params.callback
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            remove: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    eqFTPconnections[params.connectionID].processQueuePaused = true;
                    if (params.id === "pause") {
                        eqFTPconnections[params.connectionID].queue.forEach(function (element, index, array) {
                            eqFTPconnections[params.connectionID].queue[index].queue = "paused";
                            eqFTPconnections[params.connectionID].queue[index].status = "Paused";
                        });
                        _domainManager.emitEvent("eqFTP", "queueEvent", {status: "queuePaused", elements: eqFTPconnections[params.connectionID].queue});
                        eqFTPconnections[params.connectionID].queue = [];
                    } else if (params.id === "all") {
                        eqFTPconnections[params.connectionID].queue = [];
                    } else {
                            eqFTPconnections[params.connectionID].currentElement.status = "Cancelled";
                            _commands.raw.abort({
                                connectionID: params.connectionID,
                                callback: function(result) {
                                    if (result) {
                                        if (debug)
                                            throwError("Aborted file's transfer: "+JSON.stringify(eqFTPconnections[params.connectionID].currentElement), true);
                                    } else {
                                        if (debug)
                                            throwError("Can't abort file's transfer: "+JSON.stringify(eqFTPconnections[params.connectionID].currentElement));
                                    }
                                }
                            });
                        }
                        eqFTPconnections[params.connectionID].queue.forEach(function (element, index, array) {
                            if (element.id === params.id) {
                                eqFTPconnections[params.connectionID].queue.splice(index, 1);
                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "queuerRemoved", element: element});
                            }
                        });
                        if (eqFTPconnections[params.connectionID].currentElement.id == params.id) {
                    }
                    eqFTPconnections[params.connectionID].processQueuePaused = false;
                    _commands.queue.process({
                        connectionID: params.connectionID,
                        callback: params.callback
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: "+params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            process: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if (!eqFTPconnections[params.connectionID].processQueuePaused) {
                        if (eqFTPconnections[params.connectionID].queue !== undefined && eqFTPconnections[params.connectionID].queue.length > 0) {
                            if (!eqFTPconnections[params.connectionID].busy) {
                                var queuer = eqFTPconnections[params.connectionID].queue.shift();
                                eqFTPconnections[params.connectionID].currentElement = queuer;
                                eqFTPconnections[params.connectionID].busy = true;
                                _commands.connection.connect({
                                    connectionID: params.connectionID,
                                    callback: function(result) {
                                        if (result) {
                                            if (queuer.type === "folder" || queuer.type === "folderRecursive") {
                                                if (queuer.path === "'eqFTP'root'")
                                                    queuer.path = "";
                                                var path = normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + queuer.path);
                                                _commands.service.getPath({
                                                    connectionID: params.connectionID,
                                                    path: path,
                                                    callback: function(err, files) {
                                                        eqFTPconnections[params.connectionID].busy = false;
                                                        if (!err) {
                                                            if (debug)
                                                                throwError("Got folder: " + path, true);
                                                            if (queuer.type === "folderRecursive") {
                                                                _domainManager.emitEvent("eqFTP", "getDirectory", {
                                                                    err: err,
                                                                    files: files,
                                                                    path: queuer.path,
                                                                    filesToQueue: queuer.filesToQueue,
                                                                    connectionID: params.connectionID
                                                                });
                                                                files.forEach(function (element, index, array) {
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
                                                                _domainManager.emitEvent("eqFTP", "getDirectory", {err: err, files: files, path: queuer.path, connectionID: params.connectionID});
                                                            }
                                                        } else {
                                                            if (debug)
                                                                throwError("Can't get folder: " + path + ". Error: " + JSON.stringify(err), true);
                                                            _commands.connection.disconnect({
                                                                connectionID: params.connectionID,
                                                                callback: function(result) {
                                                                    if (params.callback)
                                                                        params.callback(false);
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            } else if (queuer.type === "file") {
                                                _commands.file.process({
                                                    connectionID: params.connectionID,
                                                    callback: function (result) {
                                                        eqFTPconnections[params.connectionID].busy = false;
                                                        if (!result) {
                                                            _commands.connection.reconnect({
                                                                connectionID: params.connectionID,
                                                                callback: function (result) {
                                                                    if (result) {
                                                                        _commands.queue.process({
                                                                            connectionID: params.connectionID,
                                                                            callback: params.callback
                                                                        });
                                                                    } else {
                                                                        if (debug)
                                                                            throwError("Can't reconnect to server on connectionID: " + params.connectionID + ". Queue cleared now.");
                                                                        _commands.connection.disconnect({
                                                                            connectionID: params.connectionID,
                                                                            clearQueue: true,
                                                                            callback: function(result) {
                                                                                if (params.callback)
                                                                                    params.callback(false);
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            });
                                                        } else {
                                                            _commands.queue.process({
                                                                connectionID: params.connectionID,
                                                                callback: params.callback
                                                            });
                                                        }
                                                    }
                                                });
                                            } else {
                                                eqFTPconnections[params.connectionID].currentElement = false;
                                                eqFTPconnections[params.connectionID].busy = false;
                                                if (debug)
                                                    throwError("This queuer is not folder or file. Not really sure what to do with it. Just skipping...");
                                                _commands.queue.process({
                                                    connectionID: params.connectionID,
                                                    callback: params.callback
                                                });
                                            }
                                        } else {
                                            if (debug)
                                                throwError("Can't connect to server on connectionID: " + params.connectionID + ". Queue cleared now.");
                                            _commands.connection.disconnect({
                                                connectionID: params.connectionID,
                                                clearQueue: true,
                                                callback: function(result) {
                                                    if (params.callback)
                                                        params.callback(false);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                if (debug)
                                    throwError("Queue is busy now.", true);
                            }
                        } else {
                            if (!eqFTPconnections[params.connectionID].keepAlive || eqFTPconnections[params.connectionID].keepAlive < 1) {
                                _commands.connection.disconnect({
                                    connectionID: params.connectionID
                                });
                            }
                            if (debug)
                                throwError("Queue is empty", true);
                            _domainManager.emitEvent("eqFTP", "queueEvent", {status: "queueDone"});
                        }
                    } else {
                        if (debug)
                            throwError("Queue paused for this connection ID: " + params.connectionID);
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            }
        },
        file: {
            upload: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                        // SFTP
                        console.log(eqFTPconnections[params.connectionID]);
                    } else {
                        // FTP
                        eqFTPconnections[params.connectionID].client.put(eqFTPconnections[params.connectionID].currentElement.localPath, eqFTPconnections[params.connectionID].currentElement.aRemotePath, function (hadErr) {
                            if (!hadErr) {
                                if (debug)
                                    throwError(eqFTPconnections[params.connectionID].currentElement.remotePath + ": File uploaded successfully!", true);
                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadComplete", element: eqFTPconnections[params.connectionID].currentElement});
                                if (params.callback)
                                    params.callback(true);
                            } else {
                                throwError(eqFTPconnections[params.connectionID].currentElement.remotePath + ": There was an error uploading the file.");
                                throwError(JSON.stringify(hadErr));
                                eqFTPconnections[params.connectionID].currentElement.status = hadErr.code;
                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "uploadError", element: eqFTPconnections[params.connectionID].currentElement});
                                if (params.callback)
                                    params.callback(false);
                            }
                        });
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            download: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                        // SFTP
                        console.log(eqFTPconnections[params.connectionID]);
                    } else {
                        // FTP
                        eqFTPconnections[params.connectionID].client.get(eqFTPconnections[params.connectionID].currentElement, function (hadErr) {
                            if (hadErr && hadErr!=null) {
                                eqFTPconnections[params.connectionID].currentElement.status = hadErr.code;
                                _domainManager.emitEvent("eqFTP", "queueEvent", {status: "downloadError", element: eqFTPconnections[params.connectionID].currentElement});
                                throwError("There was an error downloading the file.");
                                throwError(JSON.stringify(hadErr));
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
                                if (debug)
                                    throwError("File downloaded successfully!", true);
                                console.log(eqFTPconnections[params.connectionID].currentElement);
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
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            process: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    console.log(eqFTPconnections[params.connectionID].currentElement);
                    var e = eqFTPconnections[params.connectionID].currentElement,
                        aRemotePath = normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + e.remotePath),
                        dir = normalizePath(aRemotePath.substr(0, aRemotePath.lastIndexOf("/")));

                    eqFTPconnections[params.connectionID].currentElement.aRemotePath = aRemotePath;
                    eqFTPconnections[params.connectionID].currentElement.remotePath = e.remotePath;
                    if (debug)
                        throwError("Trying to "+e.direction+" file: " + e.localPath + " to " + aRemotePath, true);

                    console.log(dir);
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if (eqFTPconnections[params.connectionID].currentElement.direction === "upload") {
                                    _commands.service.getPath({
                                        connectionID: params.connectionID,
                                        path: dir,
                                        callback: function(err, result) {
                                            if ( err && ( err.code == 450 || err.code == 550 )) {
                                                if (debug)
                                                    throwError(JSON.stringify(err), true);

                                                _commands.service.rrdc({
                                                    connectionID: params.connectionID,
                                                    finalPath: dir,
                                                    callback: function (result) {
                                                        if (result) {
                                                            _commands.file.upload({
                                                                connectionID: params.connectionID,
                                                                callback: params.callback
                                                            });
                                                        } else {
                                                            if (params.callback)
                                                                params.callback(false);
                                                        }
                                                    }
                                                });
                                            } else if (result) {
                                                _commands.file.upload({
                                                    connectionID: params.connectionID,
                                                    callback: params.callback
                                                });
                                            } else {
                                                if (debug)
                                                    throwError("There is error uploading file. Server returned error but it's code isn't right: " + JSON.stringify(err) + result);
                                                if (params.callback)
                                                    params.callback(false);
                                            }
                                        }
                                    });
                                } else if (eqFTPconnections[params.connectionID].currentElement.direction === "download") {
                                    _commands.service.getPath({
                                        connectionID: params.connectionID,
                                        path: dir,
                                        callback: function(err, result) {
                                            if (!err && result) {
                                                mkpath(eqFTPconnections[params.connectionID].currentElement.localPath, function (err) {
                                                    if (err) {
                                                        throwError(err);
                                                        if (params.callback)
                                                            params.callback(false);
                                                    } else {
                                                        if (debug)
                                                            throwError("Directory structure \"" + eqFTPconnections[params.connectionID].currentElement.localPath + "\" is ready.", true);
                                                        eqFTPconnections[params.connectionID].currentElement.size = 1;
                                                        if (result !== undefined && result[0] !== undefined && result[0].size !== undefined) {
                                                            eqFTPconnections[params.connectionID].currentElement.size = result[0].size;
                                                        }
                                                        eqFTPconnections[params.connectionID].currentElement.localPath = normalizePath(eqFTPconnections[params.connectionID].currentElement.localPath + "/" + eqFTPconnections[params.connectionID].currentElement.name);
                                                        _commands.file.download({
                                                            connectionID: params.connectionID,
                                                            callback: params.callback
                                                        });
                                                    }
                                                });
                                            } else {
                                                if (debug)
                                                    throwError("There is error downloading file. Server returned error: " + JSON.stringify(err) + result);
                                                if (params.callback)
                                                    params.callback(false);
                                            }
                                        }
                                    });
                                } else {
                                    if (debug)
                                        throwError("File's operation's direction unknown: " + eqFTPconnections[params.connectionID].currentElement.direction + ". The file is: " + JSON.stringify(eqFTPconnections[params.connectionID].currentElement));
                                    if (params.callback)
                                        params.callback(false);
                                    else
                                        return false;
                                }
                            } else {
                                if (debug)
                                    throwError("Can't do things with file, because can't connect to server on connectionID: " + params.connectionID);
                                if (params.callback)
                                    params.callback(false);
                                else
                                    return false;
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            /**
             * Renames remote file/folder
             * @param   {Object}  params Accepts connectionID, callback
             * @returns {Boolean} [[Description]]
             */
            rename: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                        // SFTP
                        console.log(eqFTPconnections[params.connectionID]);
                    } else {
                        // FTP
                        eqFTPconnections[params.connectionID].client.raw({
                            command: "RNFR",
                            arguments: [normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.from)],
                            callback: function(err, data) {
                                if (err) {
                                    if (params.callback)
                                        params.callback(false);
                                    _domainManager.emitEvent("eqFTP", "otherEvents", {event: "rename", files: {path: params.from, connectionID: params.connectionID}, err: err, data: data});
                                } else {
                                    eqFTPconnections[params.connectionID].client.raw({
                                        command: "RNTO",
                                        arguments: [normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.to)],
                                        callback: function(err, data) {
                                            if (err) {
                                                if (params.callback)
                                                    params.callback(false);
                                                _domainManager.emitEvent("eqFTP", "otherEvents", {event: "rename", files: {path: params.to, connectionID: params.connectionID}, err: err, data: data});
                                            } else {
                                                _domainManager.emitEvent("eqFTP", "otherEvents", {event: "rename", files: {path: params.from, connectionID: params.connectionID, oldName: params.oldName, newName: params.newName}, err: err, data: data});
                                                if (params.callback)
                                                    params.callback(true);
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            delete: {
                pending: function(params) {
                    if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                        if (!eqFTPconnections[params.connectionID].pendingDelete)
                            eqFTPconnections[params.connectionID].pendingDelete = [];

                        if (eqFTPconnections[params.connectionID].pendingDelete.length > 0) {
                            var item = eqFTPconnections[params.connectionID].pendingDelete.shift();
                            if (item.type === "folder") {
                                eqFTPconnections[params.connectionID].pendingDelete.unshift(item);
                            }
                            _commands.file.delete.del({
                                connectionID: params.connectionID,
                                type: item.type,
                                path: item.path,
                                callback: function() {
                                    _commands.file.delete.pending({
                                        connectionID: params.connectionID
                                    });
                                }
                            });
                        }
                    } else {
                        if (debug)
                            throwError("There's no connection with this ID: " + params.connectionID);
                        if (params.callback)
                            params.callback(false);
                        else
                            return false;
                    }
                },
                del: function(params) {
                    if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                        if (!eqFTPconnections[params.connectionID].pendingDelete) {
                            eqFTPconnections[params.connectionID].pendingDelete = [];
                        }
                        if (params.type === "folder") {
                            if (params.initial) {
                                eqFTPconnections[params.connectionID].pendingDelete.unshift({
                                    path: params.path,
                                    type: "folder",
                                    initial: true
                                });
                            }
                            _commands.service.getPath({
                                connectionID: params.connectionID,
                                path: normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path),
                                callback: function (err, contents) {
                                    if (err) {
                                        _domainManager.emitEvent("eqFTP", "otherEvents", {event: "delete", files: {path: params.path, connectionID: params.connectionID}, err: err, data: contents});
                                    } else if (contents && contents.length > 0) {
                                        contents.forEach(function(element, index, array) {
                                            if (element.type === 0) {
                                                // File
                                                eqFTPconnections[params.connectionID].pendingDelete.unshift({
                                                    path: params.path + "/" + element.name,
                                                    type: "file"
                                                });
                                            } else {
                                                eqFTPconnections[params.connectionID].pendingDelete.unshift({
                                                    path: params.path + "/" + element.name,
                                                    type: "folder"
                                                });
                                            }
                                        });
                                        _commands.file.delete.pending({
                                            connectionID: params.connectionID
                                        });
                                    } else {
                                        _commands.raw.rmd({
                                            connectionID: params.connectionID,
                                            callback: params.callback,
                                            path: params.path
                                        });
                                    }
                                }
                            });
                        } else {
                            _commands.raw.dele({
                                connectionID: params.connectionID,
                                path: params.path,
                                callback: params.callback
                            });
                        }
                    } else {
                        if (debug)
                            throwError("There's no connection with this ID: " + params.connectionID);
                        if (params.callback)
                            params.callback(false);
                        else
                            return false;
                    }
                }
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
            "addConnections",
            addConnections,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "addToQueue",
            _commands.queue.add,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "removeFromQueue",
            _commands.queue.remove,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "disconnect",
            _commands.connection.disconnect,
            false
        );
                
        DomainManager.registerCommand(
            "eqFTP",
            "connect",
            _commands.connection.connect,
            false
        );
                
        DomainManager.registerCommand(
            "eqFTP",
            "updateSettings",
            updateSettings,
            false
        );

        DomainManager.registerCommand(
            "eqFTP",
            "rename",
            _commands.file.rename,
            false
        );
        
        DomainManager.registerCommand(
            "eqFTP",
            "delete",
            _commands.file.delete.del,
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