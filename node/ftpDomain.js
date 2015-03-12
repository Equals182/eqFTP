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
        crypto = require('crypto'),
        jsdiff = require('jsdiff'),
        gi_parser = require('gitignore-parser'),
        
        debug = false,
        _domainManager,
        eqFTPconnections = [],
        tmpFilename = "tmp.eqFTPtmp",
        tmpNewFilename = "newtmp.eqFTPtmp",
        tmpCheckdiffFilename = "tmpCheckDiff.eqFTPtmp",
        diffPreviewFile = "diffPreview.eqFTPtmp.html",
        plusGitignore = diffPreviewFile + "\n" + "**/" + diffPreviewFile + "\n*.eqFTPtmp\n" + "**/*.eqFTPtmp\n",
        defaultLocal = "",
        listInterval = null,
        checkDiffTimeout = false;
        
    function normalizePath(input) {
        if (typeof input === "string") {
            return input.replace(/[\\|\/\/]+/g, '/');
        }
        return input;
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
        var key = params.pass,
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
    function cmdCompareFiles(file1, file2) {
        var hash1 = crypto.createHash('sha512').update(fs.readFileSync(file1, {encoding: "utf8"})).digest('hex');
        var hash2 = crypto.createHash('sha512').update(fs.readFileSync(file2, {encoding: "utf8"})).digest('hex');
        if (hash1 === hash2)
            return true;
        else
            return false;
    }
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    function escapeHtml(string) {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
          return entityMap[s];
        });
    }
    function findDiff(file1, file2, event) {
        var diff = jsdiff.diffChars(fs.readFileSync(file1, {encoding: "utf8"}), fs.readFileSync(file2, {encoding: "utf8"}));
        var r = "<pre>";
        diff.forEach(function (element, index, array) {
            if (element.added)
                r += "<span class='added'>";
            if (element.removed)
                r += "<span class='removed'>";
            r += escapeHtml(element.value);
            if (element.added || element.removed)
                r += "</span>";
        });
        r += "</pre>\n\n<style>.added{color:#3d600c;display:inline-block;background-color:#ddfcb2}.removed{color:#670a0a;display:inline-block;background-color:#fcc0c0;}</style>";
        fs.writeFileSync(normalizePath(defaultLocal + "/" + diffPreviewFile), r);
        if (event)
            _domainManager.emitEvent("eqFTP", "events", {event: "diff_found", diff: diff, path: normalizePath(defaultLocal + "/" + diffPreviewFile)});
        return diff;
    }
    function getAvailableCommands(params) {
        if (params.check && eqFTPconnections[params.connectionID].ftpDomain.supportedCommands.indexOf(params.check) > -1) {
            return true;
        } else {
            return false;
        }
    }
    function addConnections(params) {
        if (eqFTPconnections.length < 1) {
            eqFTPconnections = params.connections;
            eqFTPconnections.forEach(function (element, index, array) {
                eqFTPconnections[index].ftpDomain = {};
                var gitignore = "";
                if (eqFTPconnections[index].automatization.type === "sync" && params.sync && eqFTPconnections[index].automatization.sync.ignore) {
                    gitignore = eqFTPconnections[index].automatization.sync.ignore + "\n";
                }
                gitignore += plusGitignore;
                gitignore = gi_parser.compile(gitignore);
                eqFTPconnections[index].ftpDomain.ignore = gitignore;
            });
        } else {
            var old = eqFTPconnections;
            eqFTPconnections = [];
            params.connections.forEach(function (element, index, array) {
                if(old[index]) {
                    if (
                        element.server != old[index].server ||
                        element.username != old[index].username ||
                        element.password != old[index].password ||
                        element.port != old[index].port ||
                        element.protocol != old[index].protocol ||
                        element.remotepath != old[index].remotepath
                    ) {
                        eqFTPconnections[index] = old[index];
                        _commands.connection.disconnect({
                            connectionID: index,
                            callback: function() {
                                eqFTPconnections[index] = element;
                                eqFTPconnections[index].ftpDomain = {};
                                eqFTPconnections[index].remoteRoot = false;
                            }
                        });
                    } else {
                        eqFTPconnections[index] = old[index];
                    }
                } else {
                    eqFTPconnections[index] = element;
                    eqFTPconnections[index].ftpDomain = {};
                    eqFTPconnections[index].remoteRoot = false;
                }
                var gitignore = "";
                if (eqFTPconnections[index].automatization.type === "sync" && params.sync && eqFTPconnections[index].automatization.sync.ignore) {
                    gitignore = eqFTPconnections[index].automatization.sync.ignore + "\n";
                }
                gitignore += plusGitignore;
                gitignore = gi_parser.compile(gitignore);
                eqFTPconnections[index].ftpDomain.ignore = gitignore;
            });
        }
    }
    function updateSettings(params) {
        if (params.debug === true || params.debug === false) {
            debug = params.debug || false;
            for (var i = 0; i < eqFTPconnections.length; i++) {
                if (eqFTPconnections[i].ftpDomain.client) {
                    eqFTPconnections[i].ftpDomain.client.setDebugMode = debug;
                }
            }
        }
        if (params.defaultLocal)
            defaultLocal = params.defaultLocal;
    }
    function remote2local(params) {
        var root = eqFTPconnections[params.connectionID].localpath == "" ? normalizePath(defaultLocal + "/" + eqFTPconnections[params.connectionID].connectionName) : eqFTPconnections[params.connectionID].localpath;
        return normalizePath(root + "/" + params.remotePath);
    }
    function getParentFolder(path) {
        if (typeof path === "string")
            return path.replace(/\/[^/]*$/g, "");
        return path;
    }
    var statuses = {
        "a": "QUEUE_TASK_STATUS_WAITING",
        "p": "QUEUE_TASK_STATUS_PAUSE",
        "f": "QUEUE_TASK_STATUS_FAIL",
        "s": "QUEUE_TASK_STATUS_SUCCESS",
        "g": "QUEUE_TASK_STATUS_STARTED",
        "d": "QUEUE_TASK_STATUS_DELETED"
    };
    function checkDiff(params) {
        if(!checkDiffTimeout) {
            checkDiffTimeout = setInterval(function() {
                clearInterval(checkDiffTimeout);
                checkDiffTimeout = false;
            }, 10);
            _commands.queue.add({
                queue: "a",
                type: "file",
                connectionID: params.connectionID,
                direction: "download",
                localPath: remote2local({
                    connectionID: params.connectionID,
                    remotePath: "/" + tmpCheckdiffFilename
                }),
                remotePath: params.remotePath,
                noTmp: true,
                callback: function(result) {
                    clearInterval(checkDiffTimeout);
                    checkDiffTimeout = false;
                    if (result) {
                        var local = remote2local({connectionID: params.connectionID, remotePath: "/" + params.remotePath}),
                            tmp = remote2local({connectionID: params.connectionID, remotePath: "/" + tmpCheckdiffFilename});
                        if (!cmdCompareFiles(tmp, local)) {
                            _domainManager.emitEvent("eqFTP", "events", {event: 'files_different', connectionID: params.connectionID, localPath: local, remotePath: params.remotePath});
                        }
                    }
                    if (params.after && params.after == "disconnect") {
                        _commands.connection.disconnect({
                            connectionID: params.connectionID
                        });
                    }
                }
            });
        } else {
            console.log("[eqFTP] Previous file for comparing is still in queue. Comparing will continue after that file will be processed.");
        }
    }
    function eqFTPcheckDiffDelete(connectionID) {
        if (connectionID > -1) {
            fs.unlinkSync(remote2local({
                connectionID: connectionID,
                remotePath: "/" + tmpCheckdiffFilename
            }));
        }
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
                    if (!eqFTPconnections[params.connectionID].ftpDomain.client) {
                        if (debug)
                            throwError("Connecting...", true);
                        if (!eqFTPconnections[params.connectionID].listeners)
                            eqFTPconnections[params.connectionID].listeners = {};

                        if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                            // SFTP
                            var sftp_params = {
                                host: eqFTPconnections[params.connectionID].server,
                                username: eqFTPconnections[params.connectionID].username,
                                port: eqFTPconnections[params.connectionID].port
                            };
                            if (eqFTPconnections[params.connectionID].RSA) {
                                if(fs.existsSync(eqFTPconnections[params.connectionID].RSA)){
                                    sftp_params.privateKey = fs.readFileSync(eqFTPconnections[params.connectionID].RSA);
                                }
                            } else if (eqFTPconnections[params.connectionID].password) {
                                sftp_params.password = eqFTPconnections[params.connectionID].password;
                            }
                                
                            eqFTPconnections[params.connectionID].ftpDomain.client = new SFTPClient.Client(sftp_params);
                            _commands.service.listeners({
                                connectionID: params.connectionID,
                                action: "add"
                            });
                            eqFTPconnections[params.connectionID].ftpDomain.client.sftp(function(err, sftp) {
                                if (!err) {
                                    eqFTPconnections[params.connectionID].ftpDomain.sftpClient = sftp;
                                    if (params.callback)
                                        params.callback(true);
                                    else
                                        return true;
                                } else {
                                    if (debug)
                                        throwError("[c.cC] Can't create sftp Client for ID: " + params.connectionID);
                                    if (params.callback)
                                        params.callback(false);
                                    else
                                        return false;
                                }
                            });
                        } else {
                            // FTP
                            eqFTPconnections[params.connectionID].ftpDomain.client = new FTPClient({
                                host: eqFTPconnections[params.connectionID].server,
                                user: eqFTPconnections[params.connectionID].username,
                                pass: eqFTPconnections[params.connectionID].password,
                                port: eqFTPconnections[params.connectionID].port,
                                debugMode: debug
                            });
                            _commands.service.listeners({
                                connectionID: params.connectionID,
                                action: "add",
                                callback: params.callback
                            });
                        }
                    } else {
                        if (debug)
                            throwError("[c.cC] Client already exists for ID: " + params.connectionID, true);
                        if (params.callback)
                            params.callback(true);
                        else
                            return true;
                    }
                } else {
                    if (debug)
                        throwError("[c.cC] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            connect: function(params) {
                if (debug)
                    throwError("Connecting to this ID: "+params.connectionID, true);
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && !eqFTPconnections[params.connectionID].ftpDomain.disconnecting) {
                    /*
                    1. Create Client
                    2. Add Listeners
                    3. Authorize
                    */
                    if (eqFTPconnections[params.connectionID].ftpDomain.client === undefined) {
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
                            throwError("[c.c] Connection already exists for this ID: "+params.connectionID, true);
                        if (params.callback)
                            params.callback(true);
                        else
                            return false;
                    }
                } else {
                    if (debug)
                        throwError("[c.c] There's no connection with this ID: "+params.connectionID + ". Or ftpDomain currently disconnecting from this server.");
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
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && !eqFTPconnections[params.connectionID].ftpDomain.disconnecting) {
                    if (debug)
                        throwError("Disconnecting...", true);
                    eqFTPconnections[params.connectionID].ftpDomain.disconnecting = true;
                    eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = true;
                    if (eqFTPconnections[params.connectionID].ftpDomain.client) {
                        console.log("[TEST-ECONNRESET] Have client");
                        _commands.service.clearKeepAlive({connectionID: params.connectionID});
                        _commands.service.listeners({
                            connectionID: params.connectionID,
                            action: "remove",
                            callback: function(result) {
                                console.log("[TEST-ECONNRESET] Removing listeners");
                                if (result) {
                                    console.log("[TEST-ECONNRESET] Listeners removed");
                                    var disconnected = false;
                                    if (!disconnected) {
                                        _commands.raw.abort({
                                            connectionID: params.connectionID,
                                            callback: function() {
                                                console.log("[TEST-ECONNRESET] Abort performed");
                                                if (!disconnected) {
                                                    _commands.raw.quit({
                                                        connectionID: params.connectionID,
                                                        callback: function() {
                                                            console.log("[TEST-ECONNRESET] Quit performed");
                                                            if (!disconnected) {
                                                                _commands.service.destroy({
                                                                    connectionID: params.connectionID,
                                                                    callback: function() {
                                                                        eqFTPconnections[params.connectionID].ftpDomain.client = undefined;
                                                                        disconnected = true;
                                                                        if (params.clearQueue)
                                                                            eqFTPconnections[params.connectionID].ftpDomain.queue = {a: [], p: [], f: [], s: []};
                                                                        if (debug)
                                                                            throwError("Disonnected.", true);
                                                                        eqFTPconnections[params.connectionID].ftpDomain.disconnecting = false;
                                                                        _domainManager.emitEvent("eqFTP", "events", {event: "server_disconnect", connectionID: params.connectionID, clearQueue: params.clearQueue});
                                                                        eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = false;
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
                                                    eqFTPconnections[params.connectionID].ftpDomain.client = undefined;
                                                    disconnected = true;
                                                    if (params.clearQueue)
                                                        eqFTPconnections[params.connectionID].ftpDomain.queue = {a: [], p: [], f: [], s: []};
                                                    if (debug)
                                                        throwError("Disonnected..", true);
                                                    eqFTPconnections[params.connectionID].ftpDomain.disconnecting = false;
                                                    _domainManager.emitEvent("eqFTP", "events", {event: "server_disconnect", connectionID: params.connectionID, clearQueue: params.clearQueue});
                                                    eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = false;
                                                    if (params.callback)
                                                        params.callback(true);
                                                    else
                                                        return true;
                                                }
                                            });
                                        }
                                        clearInterval(int);
                                    }, 2000);
                                }
                            }
                        });
                    } else {
                        eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = false;
                        eqFTPconnections[params.connectionID].ftpDomain.client = undefined;
                        if (params.clearQueue)
                            eqFTPconnections[params.connectionID].ftpDomain.queue = {a: [], p: [], f: [], s: []};
                        if (debug)
                            throwError("Disonnected. Actually there was no client so nothing to disconnect.", true);
                        _domainManager.emitEvent("eqFTP", "events", {event: "server_disconnect", connectionID: params.connectionID, clearQueue: params.clearQueue});
                        if (params.callback)
                            params.callback(true);
                        else
                            return true;
                    }
                } else {
                    if (debug)
                        throwError("[c.d] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections[params.connectionID].ftpDomain.disconnecting));
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
                        throwError("[c.r] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
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
                            if (eqFTPconnections[params.connectionID].listeners.connect) {
                                eqFTPconnections[params.connectionID].ftpDomain.client.removeListener('ready', eqFTPconnections[params.connectionID].listeners.connect);
                                eqFTPconnections[params.connectionID].listeners.connect = null;
                            }
                            if (eqFTPconnections[params.connectionID].listeners.error) {
                                eqFTPconnections[params.connectionID].ftpDomain.client.removeListener('error', eqFTPconnections[params.connectionID].listeners.error);
                                eqFTPconnections[params.connectionID].listeners.error = null;
                            }
                            if (eqFTPconnections[params.connectionID].listeners.progress) {
                                eqFTPconnections[params.connectionID].ftpDomain.client.removeListener('transfer', eqFTPconnections[params.connectionID].listeners.progress);
                                eqFTPconnections[params.connectionID].listeners.progress = null;
                            }
                            if (params.callback)
                                params.callback(true);
                            else
                                return true;
                        } else {
                            // FTP
                            if (eqFTPconnections[params.connectionID].listeners.connect) {
                                eqFTPconnections[params.connectionID].ftpDomain.client.removeListener('connect', eqFTPconnections[params.connectionID].listeners.connect);
                                eqFTPconnections[params.connectionID].listeners.connect = null;
                            }
                            if (eqFTPconnections[params.connectionID].listeners.customError) {
                                eqFTPconnections[params.connectionID].ftpDomain.client.removeListener('customError', eqFTPconnections[params.connectionID].listeners.customError);
                                eqFTPconnections[params.connectionID].listeners.customError = null;
                            }
                            if (eqFTPconnections[params.connectionID].listeners.error) {
                                eqFTPconnections[params.connectionID].ftpDomain.client.removeListener('error', eqFTPconnections[params.connectionID].listeners.error);
                                eqFTPconnections[params.connectionID].listeners.error = null;
                            }
                            if (eqFTPconnections[params.connectionID].listeners.progress) {
                                eqFTPconnections[params.connectionID].ftpDomain.client.removeListener('progress', eqFTPconnections[params.connectionID].listeners.progress);
                                eqFTPconnections[params.connectionID].listeners.progress = null;
                            }
                            if (eqFTPconnections[params.connectionID].listeners.debug) {
                                eqFTPconnections[params.connectionID].ftpDomain.client.removeListener('jsftp_debug', eqFTPconnections[params.connectionID].listeners.debug);
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
                            // Error Listener
                            eqFTPconnections[params.connectionID].listeners.error = function (err) {
                                if (debug)
                                    throwError(JSON.stringify(err), true);
                                _commands.connection.reconnect({
                                    connectionID: params.connectionID,
                                    callback: function(result) {
                                        if (result) {
                                            _commands.queue.process({
                                                connectionID: params.connectionID
                                            });
                                        }
                                    }
                                });
                            }
                            if (eqFTPconnections[params.connectionID].ftpDomain.client)
                                eqFTPconnections[params.connectionID].ftpDomain.client.on('error', eqFTPconnections[params.connectionID].listeners.error);
                            //Connect Listener
                            eqFTPconnections[params.connectionID].listeners.connect = function () {
                                _domainManager.emitEvent("eqFTP", "events", {event: "server_connect", connectionID: params.connectionID});
                                if (debug)
                                    throwError("Connected...", true);
                                if (params.callback)
                                    params.callback(true);
                                else
                                    return true;
                            }
                            if (eqFTPconnections[params.connectionID].ftpDomain.client)
                                eqFTPconnections[params.connectionID].ftpDomain.client.on('ready', eqFTPconnections[params.connectionID].listeners.connect);
                            //Progress Listener
                            eqFTPconnections[params.connectionID].listeners.progress = function(buffer, uploaded, total) {
                                var data = {
                                    total: eqFTPconnections[params.connectionID].ftpDomain.currentElement.stats.size,
                                    transferred: (uploaded || 0) + buffer,
                                };
                                if (data.total > 1000000) {
                                    data.transferred = data.extr.progressReaded;
                                    _domainManager.emitEvent("eqFTP", "events", {
                                        event: "progress",
                                        connectionID: params.connectionID,
                                        element: eqFTPconnections[params.connectionID].ftpDomain.currentElement,
                                        data: data
                                    });
                                }
                            }
                            eqFTPconnections[params.connectionID].ftpDomain.client.on('transfer', eqFTPconnections[params.connectionID].listeners.progress);
                        } else {
                            // FTP
                            // Error Listener
                            eqFTPconnections[params.connectionID].listeners.error = function (err) {
                                if (eqFTPconnections[params.connectionID].ftpDomain.client) {
                                    if (debug) {
                                        throwError(JSON.stringify(err));
                                    }
                                    _domainManager.emitEvent("eqFTP", "events", {event: "server_connection_error", err: err, connectionID: params.connectionID});
                                    eqFTPconnections[params.connectionID].ftpDomain.client.destroy(function() {
                                        eqFTPconnections[params.connectionID].ftpDomain.client = undefined;
                                    });
                                }
                                if (params.callback)
                                    params.callback(false);
                                else
                                    return false;
                            }
                            if (eqFTPconnections[params.connectionID].ftpDomain.client)
                                eqFTPconnections[params.connectionID].ftpDomain.client.on('connectError', eqFTPconnections[params.connectionID].listeners.error);
                            //Debug Listener
                            if (debug) {
                                eqFTPconnections[params.connectionID].listeners.debug = function (eventType, data) {
                                    console.log('DEBUG: ', eventType);
                                    console.log(JSON.stringify(data, null, 2));
                                }
                                if (eqFTPconnections[params.connectionID].ftpDomain.client)
                                    eqFTPconnections[params.connectionID].ftpDomain.client.on('jsftp_debug', eqFTPconnections[params.connectionID].listeners.debug);
                            }
                            //Custom Error Listener
                            eqFTPconnections[params.connectionID].listeners.customError = function (data) {
                                if (debug)
                                    throwError(JSON.stringify(data), true);
                                _commands.connection.reconnect({
                                    connectionID: params.connectionID,
                                    callback: function(result) {
                                        if (result) {
                                            _commands.queue.process({
                                                connectionID: params.connectionID
                                            });
                                        }
                                    }
                                });
                            }
                            if (eqFTPconnections[params.connectionID].ftpDomain.client)
                                eqFTPconnections[params.connectionID].ftpDomain.client.on('customError', eqFTPconnections[params.connectionID].listeners.customError);
                            //Connect Listener
                            eqFTPconnections[params.connectionID].listeners.connect = function () {
                                _domainManager.emitEvent("eqFTP", "events", {event: "server_connect", connectionID: params.connectionID});
                                if (debug)
                                    throwError("Connected...", true);
                                if (params.callback)
                                    params.callback(true);
                                else
                                    return true;
                            }
                            if (eqFTPconnections[params.connectionID].ftpDomain.client)
                                eqFTPconnections[params.connectionID].ftpDomain.client.on('connect', eqFTPconnections[params.connectionID].listeners.connect);
                            //Progress Listener
                            eqFTPconnections[params.connectionID].listeners.progress = function(data) {
                                data.total = eqFTPconnections[params.connectionID].ftpDomain.currentElement.stats.size;
                                if (data.total > 1000000) {
                                    if (data.extr.progressTotalsize === false) {
                                        if (data.extr.progressReaded === false) { data.extr.progressReaded = 0; }
                                        data.extr.progressReaded = data.extr.progressReaded + data.chunksize;
                                        data.transferred = data.extr.progressReaded;
                                    }
                                    _domainManager.emitEvent("eqFTP", "events", {
                                        event: "progress",
                                        connectionID: params.connectionID,
                                        element: eqFTPconnections[params.connectionID].ftpDomain.currentElement,
                                        data: data
                                    });
                                }
                            }
                            eqFTPconnections[params.connectionID].ftpDomain.client.on('progress', eqFTPconnections[params.connectionID].listeners.progress);
                        }
                        if (params.callback)
                            params.callback(true);
                        else
                            return true;
                    }
                } else {
                    if (debug)
                        throwError("[s.l] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
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
                        if (eqFTPconnections[params.connectionID].keepAlive && eqFTPconnections[params.connectionID].keepAlive > 0) {
                            _commands.service.setKeepAlive({
                                connectionID: params.connectionID
                            });
                        }
                        if (params.callback)
                            params.callback(true);
                        else
                            return true;
                    } else {
                        // FTP
                        if (!eqFTPconnections[params.connectionID].auth) {
                            eqFTPconnections[params.connectionID].ftpDomain.client.auth({
                                user: eqFTPconnections[params.connectionID].username, 
                                pass: eqFTPconnections[params.connectionID].password,
                                callback: function (err, res) {
                                    if (err) {
                                        throwError("[s.a] Can't authorize on connectionID: " + params.connectionID);
                                        throwError(err);
                                        _commands.connection.disconnect({
                                            connectionID: params.connectionID,
                                            clearQeue: true
                                        });
                                        _domainManager.emitEvent("eqFTP", "events", {event: "server_auth_error", err: err, connectionID: params.connectionID});
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
                                        eqFTPconnections[params.connectionID].ftpDomain.supportedCommands = commandList;
                                        var useMLSD = getAvailableCommands({connectionID: params.connectionID, check: "MLSD"});
                                        if (useMLSD || eqFTPconnections[params.connectionID].useList)
                                            eqFTPconnections[params.connectionID].ftpDomain.client.useCommand("MLSD");

                                        if (eqFTPconnections[params.connectionID].keepAlive && eqFTPconnections[params.connectionID].keepAlive > 0) {
                                            _commands.service.setKeepAlive({
                                                connectionID: params.connectionID
                                            });
                                        }
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
                                throwError("[s.a] Client is already authorized for connection ID: "+params.connectionID, true);
                            if (params.callback)
                                params.callback(true);
                            else
                                return true;
                        }
                    }
                } else {
                    if (debug)
                        throwError("[s.a] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            destroy: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].ftpDomain.client !== undefined) {
                    if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                        // SFTP
                        if (eqFTPconnections[params.connectionID].ftpDomain.sftpClient)
                            eqFTPconnections[params.connectionID].ftpDomain.sftpClient.end();
                        if (eqFTPconnections[params.connectionID].ftpDomain.client)
                            eqFTPconnections[params.connectionID].ftpDomain.client.close();
                        params.callback();
                    } else {
                        // FTP
                        if (eqFTPconnections[params.connectionID].ftpDomain.client)
                            eqFTPconnections[params.connectionID].ftpDomain.client.destroy(params.callback);
                        else
                            params.callback();
                    }
                    eqFTPconnections[params.connectionID].auth = false;
                } else {
                    if (debug)
                        throwError("[s.d] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
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
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].ftpDomain.client !== undefined && params.finalPath !== undefined) {
                    params.i = parseInt(params.i);
                    if (isNaN(params.i))
                        params.i = 0;
                    if (params.tmpPath === undefined) 
                        params.tmpPath = "";
                        //params.tmpPath = eqFTPconnections[params.connectionID].remoteRoot;
                    if (!params.pathArray)
                        params.pathArray = params.finalPath.split('/');
                    var step = params.pathArray[params.i];
                    if (step === undefined) {
                        params.finalPath = params.finalPath.replace(/(\/$)/gi, "");
                        if (params.tmpPath === normalizePath("/" + params.finalPath)) {
                            if (debug)
                                throwError("[s.r] Directory structure on remote server successfully creaded.", true);
                            if (params.callback)
                                params.callback(true);
                            return true;
                        } else {
                            if (!params.pathArray[params.i + 1]) {
                                throwError("[s.r] Can't create directory stucture on remote server. Final path and current path are not same.");
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
                                throwError('[s.r] Checking directory: ' + tmp + "/", true);
                            
                            _commands.service.checkDir({
                                connectionID: params.connectionID,
                                path: normalizePath(tmp + "/"),
                                callback: function(result) {
                                    if (!result) {
                                        if (debug)
                                            throwError("[s.r] Directory doesn't exist: " + tmp + "/", true);
                                        if (eqFTPconnections[params.connectionID].ftpDomain.client !== null && eqFTPconnections[params.connectionID].ftpDomain.client) {
                                            _commands.raw.cwd({
                                                connectionID: params.connectionID,
                                                path: normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.tmpPath + "/"),
                                                callback: function(result) {
                                                    if (result) {
                                                        _commands.raw.mkd({
                                                            connectionID: params.connectionID,
                                                            path: normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + tmp),
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
                                            throwError("[s.r] client doesn't exist");
                                            if (params.callback)
                                                params.callback(false);
                                            return false;
                                        }
                                    } else {
                                        params.tmpPath = tmp;
                                        params.i++;
                                        return _commands.service.rrdc(params);
                                    }
                                }
                            });
                        } else {
                            params.i++;
                            _commands.service.rrdc(params);
                        }
                    }
                } else {
                    if (debug)
                        throwError("There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            getRemoteRoot: function(params) {
                if (debug)
                    throwError("[s.gRR] Getting remote root for this ID: "+params.connectionID, true);
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].ftpDomain.client !== undefined) {
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
                                                if (debug)
                                                    throwError("[s.gRR] Remote root for this ID: " + params.connectionID + " is " + path, true);
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
                                    if (debug)
                                        throwError("[s.gRR] Remote root for this ID: " + params.connectionID + " is " + path, true);
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
                        throwError("[s.gRR] There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            checkDir: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].ftpDomain.client !== undefined && params.path !== undefined) {
                    params.path = normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path);
                    _commands.raw.pwd({
                        connectionID: params.connectionID,
                        callback: function(pwd) {
                            _commands.raw.cwd({
                                connectionID: params.connectionID,
                                path: params.path,
                                callback: function(result) {
                                    if (result) {
                                        _commands.raw.pwd({
                                            connectionID: params.connectionID,
                                            callback: function(result) {
                                                var r = false;
                                                if (normalizePath(result + "/") === normalizePath(params.path + "/"))
                                                    r = true;
                                                _commands.raw.cwd({
                                                    connectionID: params.connectionID,
                                                    path: pwd,
                                                    callback: function() {
                                                        if (params.callback)
                                                            params.callback(r);
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        _commands.raw.cwd({
                                            connectionID: params.connectionID,
                                            path: pwd,
                                            callback: function() {
                                                if (params.callback)
                                                    params.callback(false);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                } else {
                    if (debug)
                        throwError("[s.cD] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            /**
             * Retrieves remote path (file/folder) and returns error & file's/folder's data
             * @param   {Object}  params Accepts connectionID, path, callback
             * @returns {Boolean} 
             returns bool or calls callback
             */
            getPath: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && eqFTPconnections[params.connectionID].ftpDomain.client !== undefined && params.path !== undefined) {
                    params.path = normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path);
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    eqFTPconnections[params.connectionID].ftpDomain.sftpClient.readdir(params.path, function(err, files) {
                                        var tmp = [];
                                        if (files) {
                                            for (var i = 0; i < files.length; i++) {
                                                tmp.push({
                                                    name: files[i].filename,
                                                    type: ( ( (files[i].attrs.isDirectory()) ? 1 : ( (files[i].attrs.isFile()) ? 0 : false ) ) ),
                                                    time: files[i].attrs.mtime * 1000,
                                                    size: files[i].attrs.size,
                                                    owner: files[i].attrs.uid,
                                                    group: files[i].attrs.gid
                                                });
                                            }
                                            files = tmp;
                                        }
                                        if (debug)
                                            throwError("[s.gP] Got Directory: " + params.path, true);
                                        if (params.callback)
                                            params.callback(err, files);
                                    });
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.ls(params.path, function (err, files) {
                                        //console.log(files);
                                        if (debug)
                                            throwError("[s.gP] Got Directory: " + params.path, true);
                                        if (params.callback)
                                            params.callback(err, files);
                                    });
                                }
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("[s.gP] There's no connection with this ID: " + params.connectionID + ". Or you forgot to pass path.");
                    if (params.callback)
                        params.callback(true, false);
                    else
                        return false;
                }
            },
            diff: {
                check: function(params) {
                    if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                        if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.check) {
                            if (debug)
                                throwError("[s.d.c] Checking files' similarity...", true);
                            if (!cmdCompareFiles(remote2local({connectionID: params.connectionID, remotePath: tmpFilename}), eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o)) {
                                if (debug)
                                    throwError("[s.d.c] Files are NOT similar.", true);
                                eqFTPconnections[params.connectionID].ftpDomain.busy = true;
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.callback = params.callback;
                                if (eqFTPconnections[params.connectionID].ftpDomain.checkDiffAction) {
                                    _commands.service.diff.action({
                                        connectionID: params.connectionID,
                                        action: eqFTPconnections[params.connectionID].ftpDomain.checkDiffAction
                                    });
                                } else {
                                    _domainManager.emitEvent("eqFTP", "events", {event: "diff_check", connectionID: params.connectionID, element: eqFTPconnections[params.connectionID].ftpDomain.currentElement});
                                }
                            } else {
                                if (debug)
                                    throwError("[s.d.c] Files are similar.", true);
                                fs.renameSync(remote2local({connectionID: params.connectionID, remotePath:tmpFilename}),eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o);
                                if (params.callback)
                                    params.callback(true);
                            }
                        } else {
                            if (params.callback)
                                params.callback(true);
                        }
                    } else {
                        if (debug)
                            throwError("[s.d.c] There's no connection with this ID: " + params.connectionID);
                        if (params.callback)
                            params.callback(false);
                    }
                },
                action: function(params) {
                    if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                        if (params.action === "compare") {
                            eqFTPconnections[params.connectionID].ftpDomain.busy = false;
                            eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = false;
                            _commands.queue.move({
                                connectionID: params.connectionID,
                                from: "a",
                                to: "p"
                            });
                            _domainManager.emitEvent("eqFTP", "events", {event: "diff_compare", local: eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o, remote: eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath, connectionID: params.connectionID});
                        } else if (params.action === "diff_show") {
                            findDiff(remote2local({connectionID: params.connectionID, remotePath:tmpFilename}), eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o, true);
                            eqFTPconnections[params.connectionID].ftpDomain.busy = false;
                            if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.callback) {
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.callback();
                            } else {
                                _commands.queue.process({
                                    connectionID: params.connectionID
                                });
                            }
                        } else if (params.action === "replace" || params.action === "replace_all") {
                            if (params.action === "replace_all")
                                eqFTPconnections[params.connectionID].ftpDomain.checkDiffAction = params.action;
                            
                            fs.renameSync(remote2local({connectionID: params.connectionID, remotePath:tmpFilename}), eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o);
                            eqFTPconnections[params.connectionID].ftpDomain.busy = false;
                            if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.callback) {
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.callback();
                            } else {
                                _commands.queue.process({
                                    connectionID: params.connectionID
                                });
                            }
                        } else if (params.action === "keep" || params.action === "keep_all") {
                            if (params.action === "keep_all")
                                eqFTPconnections[params.connectionID].ftpDomain.checkDiffAction = params.action;
                            
                            fs.unlinkSync(remote2local({connectionID: params.connectionID, remotePath:tmpFilename}));
                            eqFTPconnections[params.connectionID].ftpDomain.busy = false;
                            if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.callback) {
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.callback();
                            } else {
                                _commands.queue.process({
                                    connectionID: params.connectionID
                                });
                            }
                        }
                    } else {
                        if (debug)
                            throwError("[s.d.a] There's no connection with this ID: " + params.connectionID);
                        if (params.callback)
                            params.callback(false);
                        else
                            return false;
                    }
                },
                ignore: {
                    /**
                     * Tests single file against ingore list
                     * @param   {Object}   params   Queuer with remotePath param
                     * @param   {Function} callback function to run after everythings done
                     * @returns {Boolean}  May be a boolean or an object, passed in.
                     */
                    checkSingle: function(params, callback) {
                        if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                            if (params.remotePath) {
                                if (debug)
                                    throwError("[s.d.i.cs] Checking for ignoring.", true);
                                var gitignore = eqFTPconnections[params.connectionID].ftpDomain.ignore;
                                if (gitignore.accepts(params.remotePath)) {
                                    if (callback)
                                        callback(params);
                                    else
                                        return params;
                                } else {
                                    if (callback)
                                        callback(false);
                                    else
                                        return false;
                                }
                            } else {
                                if (callback)
                                    callback(params);
                                else
                                    return params;
                            }
                        } else {
                            if (debug)
                                throwError("[s.d.i.cs] There's no connection with this ID: " + params.connectionID);
                            if (callback)
                                callback(false);
                            else
                                return false;
                        } 
                    }
                }
            },
            setKeepAlive: function(params) {
                if (eqFTPconnections[params.connectionID].keepAlive > 0) {
                    eqFTPconnections[params.connectionID].ftpDomain.keepAlive = setInterval(function() {
                        if (eqFTPconnections[params.connectionID].ftpDomain.client) {
                            if (!eqFTPconnections[params.connectionID].ftpDomain.busy) {
                                eqFTPconnections[params.connectionID].ftpDomain.busy = true;
                                _commands.raw.keepAlive({
                                    connectionID: params.connectionID,
                                    callback: function(err) {
                                        eqFTPconnections[params.connectionID].ftpDomain.busy = false;
                                        if (err)
                                            _commands.service.clearKeepAlive({connectionID: params.connectionID});
                                    }
                                });
                            }
                        } else {
                            _commands.service.clearKeepAlive({connectionID: params.connectionID});
                        }
                    }, eqFTPconnections[params.connectionID].keepAlive * 1000);
                } else {
                    _commands.service.clearKeepAlive({connectionID: params.connectionID});
                }
            },
            clearKeepAlive: function(params) {
                if (eqFTPconnections[params.connectionID].ftpDomain.keepAlive) {
                    clearInterval(eqFTPconnections[params.connectionID].ftpDomain.keepAlive);
                    eqFTPconnections[params.connectionID].ftpDomain.keepAlive = false;
                }
            },
            outsidemkd: function(params) {
                if (params.connectionID >= 0) {
                    if (params.local) {
                        mkpath(params.path);
                    } else {
                        _commands.raw.mkd({
                            connectionID: params.connectionID,
                            path: normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path),
                            callback: function(result) {
                                if (result)
                                    _domainManager.emitEvent("eqFTP", "events", {event: "directory_created", connectionID: params.connectionID, path: params.path});
                            }
                        });
                    }
                }
            },
            outsidemkf: function(params) {
                if (params.connectionID >= 0 && params.remotePath && params.name) {
                    var path = remote2local({
                        connectionID: params.connectionID,
                        remotePath: "/" + tmpNewFilename
                    });
                    fs.writeFile(path, '', function (err) {
                        if (err) {
                            _domainManager.emitEvent("eqFTP", "events", {event: "error", connectionID: params.connectionID, pretext: "ERR_FILE_CANTCREATEFILE", text: path + "<br>" + err});
                        } else {
                            var q = {
                                remotePath: params.remotePath,
                                localPath: path,
                                name: params.name,
                                direction: 'upload',
                                queue: 'a',
                                type: "file",
                                connectionID: params.connectionID,
                                callback: function(result) {
                                    console.log("TEST CALLBACK");
                                    if (result)
                                        _domainManager.emitEvent("eqFTP", "events", {event: "file_created", connectionID: params.connectionID, path: params.remotePath});
                                }
                            }
                            _commands.queue.add(q);
                        }
                    });
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
                                    // SFTP | Just skipping
                                    if (params.callback)
                                        params.callback(true);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({command: "abor", callback: params.callback});
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
                        throwError("[r.a] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
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
                                    // SFTP | Just skipping
                                    if (params.callback)
                                        params.callback(true);
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({command: "quit", callback: params.callback});
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
                        throwError("[r.q] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
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
                                    if (!eqFTPconnections[params.connectionID].ftpDomain.pwd) {
                                        eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                            command: "pwd",
                                            callback: function (err, data) {
                                                var path = data.text.replace(/\\n|\\r\\n|\\r|\n/gi, "");
                                                console.log(err, data, path);
                                                if (!path) {
                                                    path = "/";
                                                }
                                                eqFTPconnections[params.connectionID].ftpDomain.pwd = path;
                                                if (params.callback)
                                                    params.callback(path);
                                                else
                                                    return path;
                                            }
                                        });
                                    } else {
                                        if (params.callback)
                                            params.callback(eqFTPconnections[params.connectionID].ftpDomain.pwd);
                                        else
                                            return eqFTPconnections[params.connectionID].ftpDomain.pwd;
                                    }
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({
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
                        throwError("[r.p] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
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
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                        command: "cd",
                                        arguments: [params.path],
                                        callback: function (err, data) {
                                            if (err !== null && err) {
                                                //If there's an error
                                                throwError("Can't get in directory: " + params.path + ". Trying to get in /. The error is: " + err);
                                                if (params.callback)
                                                    params.callback(false);
                                            } else {
                                                eqFTPconnections[params.connectionID].ftpDomain.pwd = params.path;
                                                if (params.callback)
                                                    params.callback(params.path);
                                            }
                                        }
                                    });
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                        command: "cwd",
                                        arguments: [params.path],
                                        callback: function (err, data) {
                                            if (err !== null && err) {
                                                //If there's an error
                                                throwError("Can't get in directory: " + params.path + ". Trying to get in /");
                                                if (params.callback)
                                                    params.callback(false);
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
                        throwError("[r.c] There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
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
                                    eqFTPconnections[params.connectionID].ftpDomain.sftpClient.mkdir(params.path, {mode: "6755"}, function(err) {
                                        if (err) {
                                            throwError("[r.m] Can't create remote directory: " + err + " : " + params.path);
                                            _domainManager.emitEvent("eqFTP", "events", {event: "error", connectionID: params.connectionID, pretext: "ERR_FILE_CANTCREATEDIR", text: params.path + "<br>" + err});
                                            if (params.callback)
                                                params.callback(false);
                                            return false;
                                        } else {
                                            if (params.callback)
                                                params.callback(true);
                                            return true;
                                        }
                                    });
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                        command: "mkd",
                                        arguments: [params.path], 
                                        callback: function (err, data) {
                                            if (err === null || !err) {
                                                if (params.callback)
                                                    params.callback(true);
                                                return true;
                                            } else {
                                                throwError("[r.m] Can't create remote directory: " + err + " " + JSON.stringify(data) + " : " + params.path);
                                                _domainManager.emitEvent("eqFTP", "events", {event: "error", connectionID: params.connectionID, pretext: "ERR_FILE_CANTCREATEDIR", text: params.path + "<br>" + JSON.stringify(data)});
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
                        throwError("[r.m] There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
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
                                    eqFTPconnections[params.connectionID].ftpDomain.sftpClient.rmdir(normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path), function(err) {
                                        if (eqFTPconnections[params.connectionID].pendingDelete && eqFTPconnections[params.connectionID].pendingDelete.length > 0) {
                                            var tmp = [];
                                            eqFTPconnections[params.connectionID].pendingDelete.forEach(function(element, index, array) {
                                                if (element.path !== params.path) {
                                                    tmp.push(element);
                                                }
                                            });
                                            eqFTPconnections[params.connectionID].pendingDelete = tmp;
                                        }
                                        if (err) {
                                            throwError("[r.m] Can't delete remote directory: " + JSON.stringify(err) + " : " + params.path);
                                            _domainManager.emitEvent("eqFTP", "events", {event: "error", connectionID: params.connectionID, pretext: "ERR_FILE_CANTDELETEDIR", text: params.path + "<br>" + JSON.stringify(err)});
                                            if (params.callback)
                                                params.callback(false);
                                            return false;
                                        } else {
                                            _domainManager.emitEvent("eqFTP", "events", {event: "directory_delete", connectionID: params.connectionID, path: params.path});
                                            if (eqFTPconnections[params.connectionID].automatization.type === "sync"
                                                && eqFTPconnections[params.connectionID].automatization.sync.delete
                                            ){
                                                fs.rmdirSync(remote2local({
                                                    connectionID: params.connectionID,
                                                    remotePath: params.path
                                                }));
                                            }
                                            if (params.callback)
                                                params.callback(true);
                                            return true;
                                        }
                                    });
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                        command: "RMD",
                                        arguments: [normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path)],
                                        callback: function(err, data) {
                                            if (eqFTPconnections[params.connectionID].pendingDelete && eqFTPconnections[params.connectionID].pendingDelete.length > 0) {
                                                var tmp = [];
                                                eqFTPconnections[params.connectionID].pendingDelete.forEach(function(element, index, array) {
                                                    if (element.path !== params.path) {
                                                        tmp.push(element);
                                                    }
                                                });
                                                eqFTPconnections[params.connectionID].pendingDelete = tmp;
                                            }
                                            if (err) {
                                                throwError("[r.m] Can't delete remote directory: " + err + JSON.stringify(data) + " : " + params.path);
                                                _domainManager.emitEvent("eqFTP", "events", {event: "error", connectionID: params.connectionID, pretext: "ERR_FILE_CANTDELETEDIR", text: params.path + "<br>" + JSON.stringify(data)});
                                                if (params.callback)
                                                    params.callback(false);
                                            } else {
                                                _domainManager.emitEvent("eqFTP", "events", {event: "directory_delete", connectionID: params.connectionID, path: params.path});
                                                if (eqFTPconnections[params.connectionID].automatization.type === "sync"
                                                    && eqFTPconnections[params.connectionID].automatization.sync.delete
                                                ){
                                                    fs.rmdirSync(remote2local({
                                                        connectionID: params.connectionID,
                                                        remotePath: params.path
                                                    }));
                                                }
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
                        throwError("[r.r] There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
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
                                var absoluteRemotePath = normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.path);
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP
                                    eqFTPconnections[params.connectionID].ftpDomain.sftpClient.unlink(absoluteRemotePath, function(err) {
                                        if (err) {
                                            _domainManager.emitEvent("eqFTP", "events", {event: "error", connectionID: params.connectionID, pretext: "ERR_FILE_CANTDELETE", text: params.path + "<br>" + JSON.stringify(err)});
                                            if (params.callback)
                                                params.callback(false);
                                        } else {
                                            _domainManager.emitEvent("eqFTP", "events", {event: "file_delete", connectionID: params.connectionID, path: params.path});
                                            if (eqFTPconnections[params.connectionID].automatization.type === "sync"
                                                && eqFTPconnections[params.connectionID].automatization.sync.delete
                                            ){
                                                fs.unlinkSync(remote2local({
                                                    connectionID: params.connectionID,
                                                    remotePath: params.path
                                                }));
                                            }
                                            if (params.callback)
                                                params.callback(true);
                                        }
                                    });
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                        command: "DELE",
                                        arguments: [absoluteRemotePath],
                                        callback: function(err, data) {
                                            if (err) {
                                                _domainManager.emitEvent("eqFTP", "events", {event: "error", connectionID: params.connectionID, pretext: "ERR_FILE_CANTDELETE", text: params.path + "<br>" + JSON.stringify(data)});
                                                if (params.callback)
                                                    params.callback(false);
                                            } else {
                                                _domainManager.emitEvent("eqFTP", "events", {event: "file_delete", connectionID: params.connectionID, path: params.path});
                                                if (eqFTPconnections[params.connectionID].automatization.type === "sync"
                                                    && eqFTPconnections[params.connectionID].automatization.sync.delete
                                                ){
                                                    fs.unlinkSync(remote2local({
                                                        connectionID: params.connectionID,
                                                        remotePath: params.path
                                                    }));
                                                }
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
                        throwError("[r.d] There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            keepAlive: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                    // SFTP | Using cd . instead of NOOP
                                    console.log("Keep Alive (cd .) SFTP");
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                        command: "cd",
                                        arguments: ["."],
                                        callback: params.callback
                                    });
                                } else {
                                    // FTP
                                    eqFTPconnections[params.connectionID].ftpDomain.client.raw({command: "NOOP", callback: params.callback});
                                }
                            } else {
                                if (params.callback)
                                    params.callback(true);
                                return false;
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("[r.ka] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
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
                    _commands.service.diff.ignore.checkSingle(params, function(params) {
                        if (params) {
                            eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = true;
                            if (!eqFTPconnections[params.connectionID].ftpDomain.queue)
                                eqFTPconnections[params.connectionID].ftpDomain.queue = {a: [], p: [], f: [], s: []};
                            if (!params.queue)
                                params.queue = "a";
                            if (params.type === "folder" || params.type === "folderRecursive") {
                                var foldersPaths = [];
                                for (var i = 0; i < eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue].length; i++) {
                                    var element = eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue][i];
                                    if (element.type === "folder" || element.type === "folderRecursive") {
                                        foldersPaths.push(element);
                                        delete eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue][i];
                                    }
                                }
                                foldersPaths.push(params);
                                eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue] = eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue].filter(function() {return true;});
                                eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue] = foldersPaths.concat(eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue]);
                            } else if (params.type === "file") {
                                eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue].forEach(function (e, i, a) {
                                    if (params.localPath === e.localPath && params.remotePath === e.remotePath && params.direction === e.direction) {
                                        delete eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue][i];
                                        if (debug)
                                            throwError("[q.a] Element with same local and remote paths and direction is already in the queue.", true);
                                    }
                                });
                                eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue] = eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue].filter(function() {return true;});
                                eqFTPconnections[params.connectionID].ftpDomain.queue[params.queue].push(params);
                            }
                            eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = false;
                            if (debug)
                                throwError("[q.a] Queue updated: " + JSON.stringify(eqFTPconnections[params.connectionID].ftpDomain.queue), true);

                            params.status = statuses[params.queue];
                            _domainManager.emitEvent("eqFTP", "events", {
                                event: "queue_update",
                                connectionID: params.connectionID,
                                element: params
                            });
                            _commands.queue.process({
                                connectionID: params.connectionID,
                                callback: params.callback
                            });
                        }
                    });
                } else {
                    if (debug)
                        throwError("[q.a] There's no connection with this ID: " + params.connectionID + ". " + JSON.stringify(eqFTPconnections));
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            process: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if (!eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused) {
                        if (eqFTPconnections[params.connectionID].ftpDomain.queue.a !== undefined && eqFTPconnections[params.connectionID].ftpDomain.queue.a.length > 0) {
                            if (!eqFTPconnections[params.connectionID].ftpDomain.busy) {
                                _domainManager.emitEvent("eqFTP", "events", {event: "working", work: true});
                                var queuer = eqFTPconnections[params.connectionID].ftpDomain.queue.a.shift();
                                queuer.status = statuses["g"];
                                _domainManager.emitEvent("eqFTP", "events", {
                                    event: "queue_update",
                                    connectionID: params.connectionID,
                                    element: queuer
                                });
                                queuer.ftpDomain = {
                                    diff: {
                                        check: false,
                                        action: false
                                    }
                                };
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement = queuer;
                                eqFTPconnections[params.connectionID].ftpDomain.busy = true;
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
                                                    path: queuer.path,
                                                    callback: function(err, files) {
                                                        eqFTPconnections[params.connectionID].ftpDomain.busy = false;
                                                        if (!err) {
                                                            if (debug)
                                                                throwError("[q.p] Got folder: " + path, true);
                                                            if (queuer.type === "folderRecursive") {
                                                                queuer.state = "closed";
                                                                _domainManager.emitEvent("eqFTP", "events", {
                                                                    event: "directory_got",
                                                                    err: err,
                                                                    files: files,
                                                                    path: queuer.path,
                                                                    filesToQueue: queuer.filesToQueue,
                                                                    connectionID: params.connectionID,
                                                                    queuer: queuer
                                                                });
                                                                files.forEach(function (element, index, array) {
                                                                    if (element.type === 1) {
                                                                        var k = 0;
                                                                        for (var i = 0; i < eqFTPconnections[params.connectionID].ftpDomain.queue.a.length; i++) {
                                                                            if (!eqFTPconnections[params.connectionID].ftpDomain.queue.a[i]) {
                                                                                k = i;
                                                                                break;
                                                                            } else if (!eqFTPconnections[params.connectionID].ftpDomain.queue.a[i+1]
                                                                                || eqFTPconnections[params.connectionID].ftpDomain.queue.a[i+1].type === "file")
                                                                            {
                                                                                k = i + 1;
                                                                                break;
                                                                            }
                                                                        }
                                                                        eqFTPconnections[params.connectionID].ftpDomain.queue.a.splice(k, 0, {
                                                                            type: "folderRecursive",
                                                                            path: queuer.path + "/" + element.name,
                                                                            connectionID: params.connectionID,
                                                                            filesToQueue: queuer.filesToQueue
                                                                        });
                                                                    }
                                                                });
                                                            } else {
                                                                _domainManager.emitEvent("eqFTP", "events", {
                                                                    event: "directory_got",
                                                                    err: err,
                                                                    files: files,
                                                                    path: queuer.path,
                                                                    connectionID: params.connectionID,
                                                                    queuer: queuer
                                                                });
                                                            }
                                                            _commands.queue.process({
                                                                connectionID: params.connectionID,
                                                                callback: params.callback
                                                            });
                                                        } else {
                                                            if (debug)
                                                                throwError("[q.p] Can't get folder: " + path + ". Error: " + JSON.stringify(err), true);
                                                            _commands.connection.disconnect({
                                                                connectionID: params.connectionID,
                                                                callback: function(result) {
                                                                    if (result) {
                                                                        _commands.queue.process({
                                                                            connectionID: params.connectionID,
                                                                            callback: params.callback
                                                                        });
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            } else if (queuer.type === "file") {
                                                _commands.file.process({
                                                    connectionID: params.connectionID,
                                                    callback: function (result) {
                                                        eqFTPconnections[params.connectionID].ftpDomain.busy = false;
                                                        if (!result) {
                                                            _commands.queue.move({
                                                                connectionID: params.connectionID,
                                                                from: "a",
                                                                to: "f",
                                                                files: [queuer]
                                                            });
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
                                                                            throwError("[q.p] Can't reconnect to server on connectionID: " + params.connectionID + ". Queue cleared now.");
                                                                        _commands.connection.disconnect({
                                                                            connectionID: params.connectionID,
                                                                            clearQueue: true,
                                                                            callback: function(result) {
                                                                                if (result) {
                                                                                    _commands.queue.process({
                                                                                        connectionID: params.connectionID,
                                                                                        callback: params.callback
                                                                                    });
                                                                                }
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            });
                                                        } else {
                                                            _commands.queue.move({
                                                                connectionID: params.connectionID,
                                                                from: "a",
                                                                to: "s",
                                                                files: [queuer]
                                                            });
                                                            _commands.queue.process({
                                                                connectionID: params.connectionID,
                                                                callback: params.callback
                                                            });
                                                        }
                                                    }
                                                });
                                            } else {
                                                eqFTPconnections[params.connectionID].ftpDomain.currentElement = false;
                                                eqFTPconnections[params.connectionID].ftpDomain.busy = false;
                                                if (debug)
                                                    throwError("[q.p] This queuer is not folder or file. Not really sure what to do with it. Just skipping...");
                                                _commands.queue.process({
                                                    connectionID: params.connectionID,
                                                    callback: params.callback
                                                });
                                            }
                                        } else {
                                            if (debug)
                                                throwError("[q.p] Can't connect to server on connectionID: " + params.connectionID + ". Queue cleared now.");
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
                                    throwError("[q.p] Queue is busy now.", true);
                            }
                        } else {
                            if ( !eqFTPconnections[params.connectionID].keepAlive || eqFTPconnections[params.connectionID].keepAlive < 1 ) {
                                _commands.connection.disconnect({
                                    connectionID: params.connectionID
                                });
                            }
                            eqFTPconnections[params.connectionID].ftpDomain.checkDiffAction = false;
                            _domainManager.emitEvent("eqFTP", "events", {event: "working", work: false});
                            if (debug)
                                throwError("[q.p] Queue is empty", true);
                        }
                    } else {
                        _domainManager.emitEvent("eqFTP", "events", {event: "working", work: false});
                        if (debug)
                            throwError("[q.p] Queue paused for this connection ID: " + params.connectionID);
                    }
                } else {
                    _domainManager.emitEvent("eqFTP", "events", {event: "working", work: false});
                    if (debug)
                        throwError("[q.p] There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            move: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = true;
                    if (debug)
                        throwError("[q.m] Moving in queue with params: " + JSON.stringify(params), true);
                    if (typeof params.from === "string")
                        params.from = [params.from];
                    if (!params.files) {
                        if (params.to)
                            eqFTPconnections[params.connectionID].ftpDomain.queue[params.to] = eqFTPconnections[params.connectionID].ftpDomain.queue[params.to].concat(eqFTPconnections[params.connectionID].ftpDomain.queue[params.from[0]]);
                        params.from.forEach(function (from, i, a) {
                            eqFTPconnections[params.connectionID].ftpDomain.queue[from].forEach(function (e, i, a) {
                                e.queue = params.to || "d";
                                e.status = statuses[params.to];
                                _domainManager.emitEvent("eqFTP", "events", {
                                    event: "queue_update",
                                    connectionID: params.connectionID,
                                    element: e
                                });
                            });
                            eqFTPconnections[params.connectionID].ftpDomain.queue[from] = [];
                        });
                    } else {
                        params.files.forEach(function (element, index, array) {
                            params.from.forEach(function (from, i, a) {
                                eqFTPconnections[params.connectionID].ftpDomain.queue[from].forEach(function (e, i, a) {
                                    if (e.id == element.id) {
                                        eqFTPconnections[params.connectionID].ftpDomain.queue[from].splice(i, 1);
                                        if (!params.to) {
                                            element.queue = "d"; // d for delete
                                            element.status = statuses[element.queue];
                                            _domainManager.emitEvent("eqFTP", "events", {
                                                event: "queue_update",
                                                connectionID: params.connectionID,
                                                element: element
                                            });
                                        }
                                    }
                                });
                            });
                            if (params.to) {
                                eqFTPconnections[params.connectionID].ftpDomain.queue[params.to].forEach(function (e, i, a) {
                                    if (e.localPath === element.localPath && e.remotePath === element.remotePath && e.direction === element.direction) {
                                        eqFTPconnections[params.connectionID].ftpDomain.queue[params.to].splice(i, 1);
                                    }
                                });
                                element.queue = params.to;
                                element.status = statuses[params.to];
                                _domainManager.emitEvent("eqFTP", "events", {
                                    event: "queue_update",
                                    connectionID: params.connectionID,
                                    element: element
                                });
                                eqFTPconnections[params.connectionID].ftpDomain.queue[params.to].push(element);
                            }
                        });
                    }
                    eqFTPconnections[params.connectionID].ftpDomain.processQueuePaused = false;
                    _commands.queue.process({
                        connectionID: params.connectionID,
                        callback: params.callback
                    });
                } else {
                    if (debug)
                        throwError("[q.m] There's no connection with this ID: " + params.connectionID);
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
                        eqFTPconnections[params.connectionID].ftpDomain.client.upload(eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath, eqFTPconnections[params.connectionID].ftpDomain.currentElement.aRemotePath, function(hadErr) {
                            if (!hadErr) {
                                if (debug)
                                    throwError(eqFTPconnections[params.connectionID].ftpDomain.currentElement.remotePath + ": File uploaded successfully!", true);
                                _domainManager.emitEvent("eqFTP", "events", {event: "upload_complete", element: eqFTPconnections[params.connectionID].ftpDomain.currentElement});
                                if (params.callback)
                                    params.callback(true);
                                if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.callback)
                                    eqFTPconnections[params.connectionID].ftpDomain.currentElement.callback(true);
                            } else {
                                throwError(eqFTPconnections[params.connectionID].ftpDomain.currentElement.remotePath + ": There was an error uploading the file.");
                                throwError(JSON.stringify(hadErr));
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.status = hadErr.code;
                                _domainManager.emitEvent("eqFTP", "events", {event: "upload_error", element: eqFTPconnections[params.connectionID].ftpDomain.currentElement});
                                if (params.callback)
                                    params.callback(false);
                            }
                        });
                    } else {
                        // FTP
                        eqFTPconnections[params.connectionID].ftpDomain.client.put(eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath, eqFTPconnections[params.connectionID].ftpDomain.currentElement.aRemotePath, function (hadErr) {
                            if (!hadErr) {
                                if (debug)
                                    throwError(eqFTPconnections[params.connectionID].ftpDomain.currentElement.remotePath + ": File uploaded successfully!", true);
                                _domainManager.emitEvent("eqFTP", "events", {event: "upload_complete", element: eqFTPconnections[params.connectionID].ftpDomain.currentElement});
                                if (params.callback)
                                    params.callback(true);
                                if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.callback)
                                    eqFTPconnections[params.connectionID].ftpDomain.currentElement.callback(true);
                            } else {
                                throwError(eqFTPconnections[params.connectionID].ftpDomain.currentElement.remotePath + ": There was an error uploading the file.");
                                throwError(JSON.stringify(hadErr));
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.status = hadErr.code;
                                _domainManager.emitEvent("eqFTP", "events", {event: "upload_error", element: eqFTPconnections[params.connectionID].ftpDomain.currentElement});
                                if (params.callback)
                                    params.callback(false);
                            }
                        });
                    }
                } else {
                    if (debug)
                        throwError("[f.u] There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            download: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    if (eqFTPconnections[params.connectionID].automatization.type === "sync"
                        && eqFTPconnections[params.connectionID].automatization.sync.checkdiff
                        && fs.existsSync(eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath)
                        && !eqFTPconnections[params.connectionID].ftpDomain.currentElement.noTmp
                       )
                    {
                        eqFTPconnections[params.connectionID].ftpDomain.currentElement.ftpDomain.diff.check = true;
                        eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o = eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath;
                        eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath = remote2local({
                            connectionID: params.connectionID,
                            remotePath: tmpFilename
                        });
                    }
                    eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath = normalizePath(eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath);
                    if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                        // SFTP
                        eqFTPconnections[params.connectionID].ftpDomain.sftpClient.fastGet(eqFTPconnections[params.connectionID].ftpDomain.currentElement.aRemotePath, eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath, function(hadErr) {
                            if (hadErr && hadErr!=null) {
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.status = hadErr.code;
                                _domainManager.emitEvent("eqFTP", "events", {event: "download_error", element: eqFTPconnections[params.connectionID].ftpDomain.currentElement, err: hadErr});
                                throwError("[f.d] There was an error downloading the file.");
                                throwError(JSON.stringify(hadErr));
                                if (params.callback)
                                    params.callback(false);
                            } else {
                                if (debug)
                                    throwError("[f.d] File downloaded successfully!", true);
                                var i = setInterval(function() {
                                    _commands.service.diff.check({
                                        connectionID: params.connectionID,
                                        callback: function(result) {
                                            if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o)
                                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath = eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o;
                                            _domainManager.emitEvent("eqFTP", "events", {event: 'download_complete', element: eqFTPconnections[params.connectionID].ftpDomain.currentElement});
                                            if (params.callback)
                                                params.callback(true);
                                            if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.callback)
                                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.callback(true);
                                        }
                                    });
                                    clearInterval(i);
                                }, 1000);
                            }
                        });
                    } else {
                        // FTP
                        eqFTPconnections[params.connectionID].ftpDomain.client.get(eqFTPconnections[params.connectionID].ftpDomain.currentElement, function (hadErr) {
                            if (hadErr && hadErr!=null) {
                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.status = hadErr.code;
                                _domainManager.emitEvent("eqFTP", "events", {event: "download_error", element: eqFTPconnections[params.connectionID].ftpDomain.currentElement, err: hadErr});
                                throwError("[f.d] There was an error downloading the file.");
                                throwError(JSON.stringify(hadErr));
                                if (params.callback)
                                    params.callback(false);
                            } else {
                                if (debug)
                                    throwError("[f.d] File downloaded successfully!", true);
                                var i = setInterval(function() {
                                    _commands.service.diff.check({
                                        connectionID: params.connectionID,
                                        callback: function(result) {
                                            if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o)
                                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath = eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath_o;
                                            _domainManager.emitEvent("eqFTP", "events", {event: 'download_complete', element: eqFTPconnections[params.connectionID].ftpDomain.currentElement});
                                            if (params.callback)
                                                params.callback(true);
                                            if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.callback)
                                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.callback(true);
                                        }
                                    });
                                    clearInterval(i);
                                }, 1000);
                            }
                        });
                    }
                } else {
                    if (debug)
                        throwError("[f.d] There's no connection with this ID: " + params.connectionID);
                    if (params.callback)
                        params.callback(false);
                    else
                        return false;
                }
            },
            process: function(params) {
                if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                    var e = eqFTPconnections[params.connectionID].ftpDomain.currentElement,
                        aRemotePath = normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + e.remotePath),
                        dir = normalizePath(e.remotePath.substr(0, e.remotePath.lastIndexOf("/")));
                        //dir = normalizePath(aRemotePath.substr(0, aRemotePath.lastIndexOf("/")));
                    eqFTPconnections[params.connectionID].ftpDomain.currentElement.aRemotePath = aRemotePath;
                    eqFTPconnections[params.connectionID].ftpDomain.currentElement.remotePath = e.remotePath;
                    if (debug)
                        throwError("Trying to "+e.direction+" file. Local path: " + e.localPath + " Remote path: " + aRemotePath, true);

                    _commands.connection.connect({
                        connectionID: params.connectionID,
                        callback: function(result) {
                            if (result) {
                                if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.direction === "upload") {
                                    _commands.file.getStats({
                                        location: "local",
                                        path: e.localPath,
                                        callback: function(stats) {
                                            eqFTPconnections[params.connectionID].ftpDomain.currentElement.stats = stats;
                                            _commands.service.checkDir({
                                                connectionID: params.connectionID,
                                                path: dir,
                                                callback: function(result) {
                                                    if (!result) {
                                                        if (debug)
                                                            throwError("Directory doesn't exist: " + dir, true);
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
                                                    } else {
                                                        _commands.file.upload({
                                                            connectionID: params.connectionID,
                                                            callback: params.callback
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    });
                                } else if (eqFTPconnections[params.connectionID].ftpDomain.currentElement.direction === "download") {
                                    _commands.file.getStats({
                                        location: "remote",
                                        path: aRemotePath,
                                        connectionID: params.connectionID,
                                        callback: function(stats) {
                                            eqFTPconnections[params.connectionID].ftpDomain.currentElement.stats = stats;
                                            _commands.service.getPath({
                                                connectionID: params.connectionID,
                                                path: dir,
                                                callback: function(err, result) {
                                                    if (!err && result) {
                                                        mkpath(getParentFolder(eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath), function (err) {
                                                            if (err) {
                                                                throwError(err);
                                                                if (params.callback)
                                                                    params.callback(false);
                                                            } else {
                                                                if (debug)
                                                                    throwError("Directory structure \"" + eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath + "\" is ready.", true);
                                                                _domainManager.emitEvent("eqFTP", "events", {event: 'local_directory_created', path: getParentFolder(eqFTPconnections[params.connectionID].ftpDomain.currentElement.localPath), connectionID: params.connectionID});
                                                                eqFTPconnections[params.connectionID].ftpDomain.currentElement.size = 1;
                                                                if (result !== undefined && result[0] !== undefined && result[0].size !== undefined) {
                                                                    eqFTPconnections[params.connectionID].ftpDomain.currentElement.size = result[0].size;
                                                                }
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
                                        }
                                    });
                                } else {
                                    if (debug)
                                        throwError("File's operation's direction unknown: " + eqFTPconnections[params.connectionID].ftpDomain.currentElement.direction + ". The file is: " + JSON.stringify(eqFTPconnections[params.connectionID].ftpDomain.currentElement));
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
                    params.remotePath = params.from;
                    _commands.service.diff.ignore.checkSingle(params, function(params) {
                        if (params) {
                            if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                // SFTP
                                eqFTPconnections[params.connectionID].ftpDomain.sftpClient.rename(normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.from), normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.to), function(err) {
                                    if (err) {
                                        if (params.callback)
                                            params.callback(false);
                                        _domainManager.emitEvent("eqFTP", "events", {event: "file_rename", files: {pathFrom: params.from, pathTo: params.to}, err: err, connectionID: params.connectionID});
                                    } else {
                                        _domainManager.emitEvent("eqFTP", "events", {event: "file_rename", files: {pathFrom: params.from, pathTo: params.to, oldName: params.oldName, newName: params.newName}, connectionID: params.connectionID});
                                        if (eqFTPconnections[params.connectionID].automatization.type === "sync"
                                            && eqFTPconnections[params.connectionID].automatization.sync.rename
                                            && fs.existsSync(remote2local({connectionID: params.connectionID, remotePath: params.from}))
                                            && !fs.existsSync(remote2local({connectionID: params.connectionID, remotePath: params.to}))
                                        ){
                                            fs.renameSync(remote2local({connectionID: params.connectionID, remotePath: params.from}), remote2local({connectionID: params.connectionID, remotePath: params.to}));
                                        }
                                        if (params.callback)
                                            params.callback(true);
                                    }
                                });
                            } else {
                                // FTP
                                eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                    command: "RNFR",
                                    arguments: [normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.from)],
                                    callback: function(err, data) {
                                        if (err) {
                                            if (params.callback)
                                                params.callback(false);
                                            _domainManager.emitEvent("eqFTP", "events", {event: "file_rename", files: {pathFrom: params.from, pathTo: params.to}, err: err, data: data, connectionID: params.connectionID});
                                        } else {
                                            eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                                command: "RNTO",
                                                arguments: [normalizePath(eqFTPconnections[params.connectionID].remoteRoot + "/" + params.to)],
                                                callback: function(err, data) {
                                                    if (err) {
                                                        if (params.callback)
                                                            params.callback(false);
                                                        _domainManager.emitEvent("eqFTP", "events", {event: "file_rename", files: {pathFrom: params.from, pathTo: params.to}, err: err, data: data, connectionID: params.connectionID});
                                                    } else {
                                                        _domainManager.emitEvent("eqFTP", "events", {event: "file_rename", files: {pathFrom: params.from, pathTo: params.to, oldName: params.oldName, newName: params.newName}, data: data, connectionID: params.connectionID});
                                                        if (eqFTPconnections[params.connectionID].automatization.type === "sync"
                                                            && eqFTPconnections[params.connectionID].automatization.sync.rename
                                                            && fs.existsSync(remote2local({connectionID: params.connectionID, remotePath: params.from}))
                                                            && !fs.existsSync(remote2local({connectionID: params.connectionID, remotePath: params.to}))
                                                        ){
                                                            fs.renameSync(remote2local({connectionID: params.connectionID, remotePath: params.from}), remote2local({connectionID: params.connectionID, remotePath: params.to}));
                                                        }
                                                        if (params.callback)
                                                            params.callback(true);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                } else {
                    if (debug)
                        throwError("[f.r] There's no connection with this ID: " + params.connectionID);
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
                                remotePath: item.path,
                                callback: function() {
                                    _commands.file.delete.pending({
                                        connectionID: params.connectionID
                                    });
                                }
                            });
                        }
                    } else {
                        if (debug)
                            throwError("[f.del.p] There's no connection with this ID: " + params.connectionID);
                        if (params.callback)
                            params.callback(false);
                        else
                            return false;
                    }
                },
                del: function(params) {
                    if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined) {
                        _commands.service.diff.ignore.checkSingle(params, function(params) {
                            if (params) {
                                if (!eqFTPconnections[params.connectionID].pendingDelete) {
                                    eqFTPconnections[params.connectionID].pendingDelete = [];
                                }
                                if (params.type === "folder") {
                                    if (params.initial) {
                                        eqFTPconnections[params.connectionID].pendingDelete.unshift({
                                            path: params.remotePath,
                                            type: "folder",
                                            initial: true
                                        });
                                    }
                                    _commands.service.getPath({
                                        connectionID: params.connectionID,
                                        path: params.remotePath,
                                        callback: function (err, contents) {
                                            if (err) {
                                                _domainManager.emitEvent("eqFTP", "events", {event: "error", connectionID: params.connectionID, pretext: "ERR_FILE_CANTDELETE", text: params.remotePath + "<br>" + JSON.stringify(contents)});
                                            } else if (contents && contents.length > 0) {
                                                contents.forEach(function(element, index, array) {
                                                    if (element.type === 0) {
                                                        // File
                                                        eqFTPconnections[params.connectionID].pendingDelete.unshift({
                                                            path: params.remotePath + "/" + element.name,
                                                            type: "file"
                                                        });
                                                    } else {
                                                        eqFTPconnections[params.connectionID].pendingDelete.unshift({
                                                            path: params.remotePath + "/" + element.name,
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
                                                    path: params.remotePath
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    _commands.raw.dele({
                                        connectionID: params.connectionID,
                                        path: params.remotePath,
                                        callback: params.callback
                                    });
                                }
                            }
                        });
                    } else {
                        if (debug)
                            throwError("[f.del.d] There's no connection with this ID: " + params.connectionID);
                        if (params.callback)
                            params.callback(false);
                        else
                            return false;
                    }
                }
            },
            getStats: function(params) {
                if (params.location === "local") {
                    if (params.path !== undefined) {
                        var stats = fs.statSync(params.path);
                        if (params.callback)
                            params.callback(stats || {size: 0});
                    } else {
                        if (debug)
                            throwError("[f.gs] Path is undefined.");
                        if (params.callback)
                            params.callback({size: 0});
                        else
                            return false;
                    }
                } else if (params.location === "remote") {
                    if (params.connectionID > -1 && eqFTPconnections[params.connectionID] !== undefined && params.path !== undefined) {
                        _commands.connection.connect({
                            connectionID: params.connectionID,
                            callback: function(result) {
                                if (result) {
                                    if(eqFTPconnections[params.connectionID].protocol === "sftp") {
                                        // SFTP
                                        eqFTPconnections[params.connectionID].ftpDomain.sftpClient.stat(params.path, function (err, stats) {
                                            if (stats[0])
                                                stats = stats[0];
                                            else
                                                stats = {size: 0};
                                            if (debug)
                                                throwError("[f.gs] Got stats: " + params.path, true);
                                            if (params.callback)
                                                params.callback(stats);
                                        });
                                    } else {
                                        // FTP
                                        eqFTPconnections[params.connectionID].ftpDomain.client.raw({
                                            command: "SIZE",
                                            arguments: [params.path], 
                                            callback: function (err, data) {
                                                stats = {size: 0};
                                                if (!err) {
                                                    stats = {size: data.text.split(" ")[1]};
                                                }
                                                if (debug)
                                                    throwError("[f.gs] Got stats: " + params.path, true);
                                                if (params.callback)
                                                    params.callback(stats);
                                            }
                                        });
                                    }
                                } else {
                                    if (params.callback)
                                        params.callback({size: 0});
                                    return false;
                                }
                            }
                        });
                    } else {
                        if (debug)
                            throwError("[f.gs] There's no connection with this ID: "+params.connectionID+". Or path is undefined.");
                        if (params.callback)
                            params.callback({size: 0});
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
            "changeQueue",
            _commands.queue.move,
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
            "mkd",
            _commands.service.outsidemkd,
            false
        );
        DomainManager.registerCommand(
            "eqFTP",
            "mkf",
            _commands.service.outsidemkf,
            false
        );
        DomainManager.registerCommand(
            "eqFTP",
            "rmd",
            _commands.raw.rmd,
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
            "eqFTPcompareFiles",
            cmdCompareFiles,
            false
        );
        DomainManager.registerCommand(
            "eqFTP",
            "eqFTPcompareAction",
            _commands.service.diff.action,
            false
        );
        DomainManager.registerCommand(
            "eqFTP",
            "eqFTPfindDiff",
            findDiff,
            false
        );
        DomainManager.registerCommand(
            "eqFTP",
            "eqFTPcheckDiff",
            checkDiff,
            false
        );
        DomainManager.registerCommand(
            "eqFTP",
            "eqFTPcheckDiffDelete",
            eqFTPcheckDiffDelete,
            false
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
            "events"
        );
    }
    exports.init = init;
}());
console.log('[eqFTP-ftpDomain] Loaded');