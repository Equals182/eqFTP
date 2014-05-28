/*
 * Copyright (c) 2014 Equals182. On base of project 'brackets-ftp' by Joseph Pender.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * version 0.4.3
 * - Added French translation
 * - Added Portuguese translation
 * - Temporary removed Error Dialog on save when project isn't connected to server.
 * version 0.4.2
 * - Improved Italian translation
 * - Updating file tree after upload temporary removed
 * version 0.4.1
 * - New strings added in German translation
 * version 0.4.0
 * - German translation
 * - Italian translation
 * - Remote FileTree scroll save!
 * - Added Folder Open Dialog for Local Root setting + autoinsert option
 * - Better file upload handling + updating folders after upload
 * - Removed .eqFTP-note file dependence + automatic connectionID resolving by path
 *
 * version 0.3.0
 * - Multilaguage Support (Contribute with translating!)
 * 
 */


define(function (require, exports, module) {
    "use strict";
    
    var nodeConnection;
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        Commands = brackets.getModule("command/Commands"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        StatusBar = brackets.getModule("widgets/StatusBar"),
        PanelManager = brackets.getModule("view/PanelManager"),
        Resizer = brackets.getModule("utils/Resizer"),
        NodeConnection = brackets.getModule("utils/NodeConnection"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        AppInit = brackets.getModule("utils/AppInit"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        FileSystem  = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        eqFTPstrings = require("strings"),
        eqFTPToolbarTemplate = require("text!htmlContent/eqFTP-toolbar.html"),
        eqFTPModalTemplate = require("text!htmlContent/eqFTP-modal.html"),
        eqFTPPasswordTemplate = require("text!htmlContent/eqFTP-password.html"),
        eqFTPSettingsTemplate = require("text!htmlContent/eqFTP-settings.html"),
        eqFTPQueueTemplate = require("text!htmlContent/eqFTP-queue.html");
    
    var eqFTP = new Object();
    var tmp_modalClickedItem;
    var queueBusy = false,
        queuePaused = false,
        currentQueueTask,
        queuePanel = false;
    
    eqFTPSettingsTemplate = Mustache.render(eqFTPSettingsTemplate, eqFTPstrings);
    eqFTPPasswordTemplate = Mustache.render(eqFTPPasswordTemplate, eqFTPstrings);
    eqFTPModalTemplate = Mustache.render(eqFTPModalTemplate, eqFTPstrings);
    eqFTPToolbarTemplate = Mustache.render(eqFTPToolbarTemplate, eqFTPstrings);
    eqFTPQueueTemplate = Mustache.render(eqFTPQueueTemplate, eqFTPstrings);

    /*
    * Here we set some global variables we'll use in future. Lasers. Hovercars. 
    */
    var defaultUsersDir = brackets.app.getUserDocumentsDirectory();
    var defaultProjectsDir = defaultUsersDir+"/eqFTP Projects";
    FileSystem.getDirectoryForPath(defaultProjectsDir).create();

    eqFTP.globals = {
        globalFtpDetails: {'main':{folderToProjects:defaultProjectsDir},'ftp':[]},
        remoteStructure: [],
        currentRemoteRoot: '',
        currentLocalRoot: "",
        connectedServer: null,
        currentDownloadedDocuments: [],
        settingsFilename: ".remotesettings",
        currentRemoteDirectory: '',
        masterPassword: null,
        defaultSettingsPath: defaultProjectsDir,
        settingsLoaded: false,
        prefs: PreferencesManager.getExtensionPrefs("eqFTP"),
        useEncryption: false,
        ftpLoaded: false,
        fileBrowserResults: "#eqFTPDirectoryListing",
        automaticQueue: [],
        pausedQueue: [],
        failedQueue: [],
        successedQueue: [],
        processQueue: [],
        scrllTop: 0,
        clickedTreeElement: 0
    };
    
    eqFTP.globals.prefs.definePreference("defaultSettingsPathPref", "string", eqFTP.globals.defaultSettingsPath);
    eqFTP.globals.prefs.definePreference("useEncryption", "string", "false");
    var tmp_defaultSettingsPath = eqFTP.globals.prefs.get("defaultSettingsPath");
    if(tmp_defaultSettingsPath!=undefined && tmp_defaultSettingsPath!="") {
        eqFTP.globals.defaultSettingsPath=tmp_defaultSettingsPath;
    }
    
    eqFTP.globals.prefs.on("change", function () {
        eqFTP.globals.defaultSettingsPath = eqFTP.globals.prefs.get("defaultSettingsPathPref");
        eqFTP.globals.useEncryption = eqFTP.globals.prefs.get("useEncryption");
        if(eqFTP.globals.useEncryption == true && eqFTP.globals.masterPassword==null) {
            //masterPassword = callPasswordDialog();
        }
    });
    
    /**
    *
    *
    ######################## Global functions ###############################
    *
    *
    */
    
    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }
    
    function isJSON(input) {
        try { JSON.parse(input); } catch (e) { return false; }
        return true;
    }
    var uniqueTreeVar = 0;
    
    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift();
            var firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }
        
    function eqFTPCheckField(id) {
        var t = $(id);
        var tmp = t.val();
        tmp = $.trim(tmp);
        t.removeClass('eqFTP-error');
        if(tmp=="") {
            t.addClass('eqFTP-error');
            eqFTP.serviceFunctions.triggerSettingsNotification({type:'error', state:true, text: eqFTPstrings.SETTINGSWIND_ERR_BLANKS});
            return false;
        }
        return true;
    }
    
    function recursiveSearch(params) {
        var level = params.level;
        var object = params.object;
        var names = params.names;
        var state = params.state;
        var addFolder = params.addFolder;
        if(names[level]==undefined && names.length>0) {
            if(addFolder!=undefined) {
                object.children = addFolder;
            }
            if(state!=undefined && (state=='opened' || state=='closed')) {
                object.state = state;
            }
        }else if($.isArray(object) && object.length==0) {
            object = addFolder;
        }else if(params.replace===true && params.replaceNow===true) {
            $.each(addFolder, function(i,o) {
                if(o.type=="folder") {
                    $.each(object, function(i2,o2) {
                        if(o2.type=="folder" && o2.name==o.name) {
                            addFolder[i].children = o2.children;
                            addFolder[i].state = o2.state;
                        }
                    });
                }
            });
            object.children = addFolder;
        }else{
            if($.isArray(object.children)) {
                object = object.children;
            }
            if(object) {
                $.each(object, function() {
                    var object = this;
                    if(object.type == "folder" && object.name == names[level]) {
                        if(params.replace===true) {
                            var replaceNow=true;
                        }else{
                            level++;
                        }
                        object = recursiveSearch({
                            level:level,
                            object:object,
                            names:names,
                            addFolder:addFolder,
                            state:state,
                            replace:params.replace,
                            replaceNow:replaceNow
                        });
                        return false;
                    }
                });
            }
        }
        return object;
    }
    
    var recSearch2Int = null;
    function recursiveSearch2(params) {
        if(params.stack==undefined) {
            params.stack = [];
        }
        var searchIn = params.searchIn;
        $.each(searchIn, function() {
            if(this.type == "folder" && this.state == params.state) {
                if(params.name==undefined) {
                    params.name = "";
                    params.stack.push("");
                }
                params.stack.push(params.name + "/" + this.name);
                if(this.children!=undefined && this.children.length>0) {
                    recursiveSearch2({
                        name: params.name + "/" + this.name,
                        searchIn: this.children,
                        stack: params.stack,
                        state: params.state,
                        callback: params.callback
                    });
                }
            }
            if(recSearch2Int!=null) {
                clearInterval(recSearch2Int);
                recSearch2Int = null;
            }
            recSearch2Int = setInterval(function(){
                if(isFunction(params.callback)) {
                    params.callback(params.stack);
                }
                clearInterval(recSearch2Int);
            },500);
        });
    }
    
    var recDirInt = null;
    var filesArray = [];
    function getLocalDirectoryRecursive(dir, callback) {
        if(!dir._contents) {
            FileSystem.getDirectoryForPath(dir._path).getContents(function(){
                getLocalDirectoryRecursive(dir, callback);
            });
        }
        if(dir._contents) {
            $.each(dir._contents, function() {
                if(this._isDirectory) {
                    filesArray = filesArray.concat(getLocalDirectoryRecursive(this, callback));
                }else if(this._isFile) {
                    filesArray.push(this);
                }
            });
        }
        if(recDirInt!=null) {
            clearInterval(recDirInt);
            recDirInt = null;
        }
        recDirInt = setInterval(function(){
            if(isFunction(callback)) {
                callback(filesArray);
            }
            clearInterval(recDirInt);
        },1000);
        return filesArray;
    }
    
    eqFTP.serviceFunctions = {
        ftpLoaded: function(e) {
            if(e) {
                $('#eqFTP-serverChoosing').show();
                $('#eqFTP-openSettingsWindow').show();
                $('#eqFTPLoading').hide();
                $('#eqFTPLoadingFailed').remove();
                $('#toolbar-eqFTP').removeClass('disabled');
                $("#eqFTPQueueIndicator").removeClass('disabled');
            }else{
                $('#eqFTP-serverChoosing').hide();
                $('#eqFTP-openSettingsWindow').hide();
                $('#eqFTPLoading').show();
                $('#eqFTPLoading').hide().after('<span id="eqFTPLoadingFailed">'+eqFTPstrings.ERR_LOADING+'</span>');
                $('#toolbar-eqFTP').addClass('disabled');
                $("#eqFTPQueueIndicator").addClass('disabled');
            }
            eqFTP.serviceFunctions.redrawRemoteModalServerList();
            eqFTP.serviceFunctions.redrawFileTree();
            eqFTP.globals.ftpLoaded = e;
        },
        normalizePath: function(input) {
            if(input != undefined) {
                var tmp = input.replace(/\\+/g,'/');
                tmp = tmp.replace(/\/\/+/g,'/');
                return tmp;
            }
            return undefined;
        },
        redrawRemoteModalServerList: function() {
            $('#eqFTP-serverChoosing').html('');
            $('#eqFTP-serverChoosing').append('<option disabled selected value="">'+eqFTPstrings.OTHER_SELECT_SERVER_DROPDOWN+'</option><option disabled>------------------------------</option>');
            var i=0;
            if(eqFTP.globals.globalFtpDetails.ftp.length>0) {
                $.each(eqFTP.globals.globalFtpDetails.ftp,function() {
                    var t = this;
                    $('#eqFTP-serverChoosing').append('<option value="'+i+'">'+t.connectionName+'</option>');
                    i++;
                });
            }
            var tmp_connectedServer = parseInt(eqFTP.globals.connectedServer);
            if(!isNaN(tmp_connectedServer)) {
                $('#eqFTP-serverChoosing option').prop('selected',false);
                $('#eqFTP-serverChoosing option[value='+tmp_connectedServer+']').prop('selected',true);
            }
        },
        redrawFileTree: function() {
            var target = $(eqFTP.globals.fileBrowserResults).find("#eqFTPTable");
            uniqueTreeVar = 0;
            var html = eqFTP.serviceFunctions.renderFTPTree({ftpFileList: eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer],path:"/"});
            target.empty().append(html);
            $('#eqFTP-project-dialog>.modal-body').scrollTop(eqFTP.globals.scrllTop);
            if(eqFTP.globals.clickedTreeElement!=0) {
                $('.eqFTPFileTreeCell').removeClass('clicked');
                $('li[data-bftControl="'+eqFTP.globals.clickedTreeElement+'"]:first').find('>div').addClass('clicked');
            }
        },
        renderFTPTree: function(params) {
            var fileList = params.ftpFileList;
            var l = parseInt(params.level);
            var needToBeOpen = params.needToBeOpen;
            if(isNaN(l)) { l = 0; }
            var lpx = l * 10;
            var html = "";
            //console.log("[eqFTP] Rendering structure (level "+l+"): "+JSON.stringify(fileList));
            if(fileList!=undefined) {
                $.each(fileList,function() {
                    var add = "";
                    var v = this;
                    var path = params.path+"/"+v.name;
                    if(v.children!=undefined && v.children.length>0) {
                        add = '<ul class="eqFTPFileTreeHolder">'+eqFTP.serviceFunctions.renderFTPTree({ftpFileList:v.children,level:l+1,path:path})+'</ul>';
                    }
                    var opened = "";
                    if(v.state!=undefined && v.state=='opened') {
                        opened = "opened";
                    }else if(v.state=='closed') {
                        opened = "closed";
                    }
                    var lp = l+1;
                    var w = 170 - lpx;
                    html = html+'<li class="eqFTPLevel'+lp+' eqFTPFileTreeRow '+opened+'" data-bftControl="'+uniqueTreeVar+'">'+
                                '<div class="eqFTPFileTreeCell eqFTP-'+v.type+' eqFTPTableNamecol" data-path="'+path+'" style="padding-left:'+lpx+'px; width:'+w+'px"><span class="eqFTPFileTreePlusMinus"></span><span title="'+v.name+'" class="eqFTPModalItemTitle">'+v.name+'</span></div>'+
                                '<div class="eqFTPFileTreeCell eqFTPTableSizecol" style="text-align:right;"><span title="'+v.size+'">'+v.sizeShort+'</span></div>'+
                                '<div class="eqFTPFileTreeCell eqFTPTableTypecol" style="text-align:right;"><span title="'+v.type+'">'+v.type+'</span></div>'+
                                '<div class="eqFTPFileTreeCell eqFTPTableLUcol" style="text-align:right;"><span title="'+v.lastupdated+'">'+v.lastupdatedShort+'</span></div>'+
                                add+'</li>';
                    uniqueTreeVar++;
                });
            }
            return html;
        },
        triggerSettingsNotification: function(params) {
            /*
            * @ params {object}:
            *   state: {boolean} | use it to turn notification on and off
            *   type: {string} ( 'notification' | 'error' ) | use one of these variants for different style
            *   text: {string} | this text will appear in alert
            *
            * I don't know how to write this docs. 2lazy2google.
            */
            var state = params.state;
            if(state == 0 || state == false) {
                $('#eqFTP-'+params.type+'Message').addClass('hide');
                return true;
            }else{
                $('#eqFTP-'+params.type+'Message').removeClass('hide');
            }
            var text = params.text;
            $('#eqFTP-'+params.type+'Message').text(text);
        },
        convertDate: function(params) {
            var fullDate = new Date(params.input);
            if(params.type=='full') {
                var r = fullDate.toUTCString();
            }else if(params.type=='short') {
                var tf = eqFTP.globals.globalFtpDetails.main.timeFormat;

                var d = fullDate.getDate();
                if(d<10) { d = "0"+d; }
                var m = fullDate.getMonth();
                if(m<10) { m = "0"+m; }
                var Y = fullDate.getFullYear();

                if(tf == 'US' || tf==undefined) {
                    var r = m + "-" + d + "-" + Y;
                }else if(tf == 'EU') {
                    var r = d + "." + m + "." + Y;
                }
            }
            return r;
        },
        shortenFilesize: function(params) {
            var bytes = parseInt(params.input);
            var si = params.si;
            si = false;
            var thresh = si ? 1000 : 1024;
            if(bytes < thresh) return bytes + ' B';
            var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
            var u = -1;
            do {
                bytes /= thresh;
                ++u;
            } while(bytes >= thresh);
            return bytes.toFixed(1)+' '+units[u];
        },
        showSettingsWindow: function(params) {
            if(params!=undefined && params.castWindow) {
                Dialogs.showModalDialogUsingTemplate(eqFTPSettingsTemplate, true).done(function (id) {
                });
            }
            $('#eqFTPAllServerList').html('');
            var i=0;
            if(eqFTP.globals.globalFtpDetails.ftp.length>0) {
                $.each(eqFTP.globals.globalFtpDetails.ftp,function() {
                    var t = this;
                    $('#eqFTPAllServerList').append('<li data-eqFTP-openSettings="'+i+'"><i class="eqFTP-icon-close eqFTP-icon" style="vertical-align:middle; margin-right:5px; margin-left:-10px;" title="'+eqFTPstrings.SETTINGSWIND_DELETECONN_HOVER+'"></i>'+t.connectionName+'</li>');
                    i++;
                });
            }
            $('#eqFTPAllServerList').append('<li data-eqFTP-addConnection="'+eqFTP.globals.globalFtpDetails.ftp.length+'"><i class="eqFTP-icon-plus eqFTP-icon" style="vertical-align:middle; margin-right:5px; margin-left:-10px;" title="'+eqFTPstrings.SETTINGSWIND_ADDCONN_HOVER+'"></i>'+eqFTPstrings.SETTINGSWIND_ADDCONN_STRING+'</li>');
            var id = parseInt($('#eqFTP-connectionID').val());
            if(!isNaN(id)) {
                $('*[data-eqFTP-opensettings='+id+']').addClass('clicked');
            }
            $('#eqFTP-ProjectsFolder').val(eqFTP.globals.globalFtpDetails.main.folderToProjects);
            if(eqFTP.globals.globalFtpDetails.main.noProjectOnDownload==true) {
                $('#eqFTP-noProjectOnDownload').prop('checked',true);
            }else{
                $('#eqFTP-noProjectOnDownload').prop('checked',false);
            }
            $('#eqFTP-SettingsFolder').val(eqFTP.globals.defaultSettingsPath);
            $('#eqFTP-useEncryption').prop('checked',eqFTP.globals.useEncryption);
        },
        switchToMainSettings: function() {
            $('*[data-eqFTP-openSettings]').removeClass('clicked');
            $('*[data-eqFTP-addConnection]').removeClass('clicked');
            $('#eqFTPGlobalSettings').addClass('clicked');
            $('#eqFTPSettingsHolder').hide();
            $('#eqFTPGlobalSettingsHolder').show();
            $("#eqFTP-connectionID").val('no');
        },
        updateOpenedFiles: function(params) {
            if(params.action=="add") {
                params.path = eqFTP.serviceFunctions.normalizePath(params.path);
                var wait = setInterval(function() {
                    var currentDocument = DocumentManager.getCurrentDocument();
                    var cDID = currentDocument.file._id;
                    eqFTP.globals.currentDownloadedDocuments[cDID] = {doc:currentDocument,path:params.path,connectionID:eqFTP.globals.connectedServer};
                    clearInterval(wait);
                },1000);
            }else if(params.action=="delete") {
                if(typeof eqFTP.globals.currentDownloadedDocuments[params.id] === "object" && eqFTP.globals.currentDownloadedDocuments[params.id]!="undefined") {
                    eqFTP.globals.currentDownloadedDocuments.splice(params.id,1);
                }
            }
        },
        tryOpenFile: function(path,i) {
            var waitASec = setInterval(function() {
                if(i==undefined) { i=0; }
                i++;
                new FileSystem.resolve(path, function(err, item, stat) {
                    if(!err) {
                        if(stat._size!=0) {
                            var openPromise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: path});
                            openPromise.done(function() {
                                eqFTP.serviceFunctions.updateOpenedFiles({action:"add",path:path})
                                i = 10;
                            });
                            openPromise.always(function() {
                            });
                            openPromise.fail(function(err) {
                                console.error('[eqFTP] Try #'+i+': failed open file.')
                            });
                        }
                    }
                });
                if(i>3) {
                    clearInterval(waitASec);
                }
            },1000);
        },
        redrawQueue: function() {
            var trs = "";
            $.each(eqFTP.globals.processQueue,function() {
                if(this!=undefined) {
                    if(this.direction == 'download') {
                        var path = this.remotePath;
                    }else if(this.direction == 'upload'){
                        var path = this.localPath;
                    }
                    if(this.transferData) {
                        var d = this.transferData.transferred,
                            t = this.transferData.total;
                        var status = Math.floor(d*100/t);
                        if(status>100) { status = 100; }
                        var percent = status;
                        status+="%";
                    }else if(this.status == undefined) {
                        var status = eqFTPstrings.OTHER_WAITING;
                    }
                    trs +=  "<tr class='transferring'>"+
                                "<td class='name' width='30%'><span title='"+this.name+"'>"+this.name+"</span></td>"+
                                "<td class='path' width='30%'><span title='"+path+"'>"+path+"</span></td>"+
                                "<td class='status' width='30%'><span>"+status+"</span><div class='progessBar' style='width:"+percent+"%;'></div></td>"+
                            "</tr>";
                }
            });
            $.each(eqFTP.globals.automaticQueue,function() {
                if(this!=undefined) {
                    if(this.direction == 'download') {
                        var path = this.remotePath;
                    }else if(this.direction == 'upload'){
                        var path = this.localPath;
                    }
                    if(this.status == undefined) {
                        var status = eqFTPstrings.OTHER_WAITING;
                    }else if(this.status) {
                        var status = eqFTPstrings.OTHER_COMPLETED;
                    }else{
                        var status = eqFTPstrings.OTHER_ERROR;
                    }
                    trs +=  "<tr class='automatic'>"+
                                "<td class='name' width='30%'><span title='"+this.name+"'>"+this.name+"</span></td>"+
                                "<td class='path' width='30%'><span title='"+path+"'>"+path+"</span></td>"+
                                "<td class='status' width='30%'>"+status+"</td>"
                            "</tr>";
                }
            });
            $.each(eqFTP.globals.pausedQueue,function() {
                if(this!=undefined) {
                    if(this.direction == 'download') {
                        var path = this.remotePath;
                    }else if(this.direction == 'upload'){
                        var path = this.localPath;
                    }
                    var status = eqFTPstrings.OTHER_PAUSED;
                    trs +=  "<tr class='paused'>"+
                                "<td class='name' width='30%'><span title='"+this.name+"'>"+this.name+"</span></td>"+
                                "<td class='path' width='30%'><span title='"+path+"'>"+path+"</span></td>"+
                                "<td class='status' width='30%'>"+status+"</td>"+
                            "</tr>";
                }
            });
            $.each(eqFTP.globals.failedQueue,function() {
                if(this!=undefined) {
                    if(this.direction == 'download') {
                        var path = this.remotePath;
                    }else if(this.direction == 'upload'){
                        var path = this.localPath;
                    }
                    var status = eqFTPstrings.OTHER_ERROR;
                    if(this.status) {
                        status = this.status;
                    }
                    trs +=  "<tr class='paused'>"+
                                "<td class='name' width='30%'><span title='"+this.name+"'>"+this.name+"</span></td>"+
                                "<td class='path' width='30%'><span title='"+path+"'>"+path+"</span></td>"+
                                "<td class='status' width='30%'><span title='"+status+"'>"+status+"</span></td>"+
                            "</tr>";
                }
            });
            $.each(eqFTP.globals.successedQueue,function() {
                if(this!=undefined) {
                    if(this.direction == 'download') {
                        var path = this.remotePath;
                    }else if(this.direction == 'upload'){
                        var path = this.localPath;
                    }
                    var status = eqFTPstrings.OTHER_COMPLETED;
                    trs +=  "<tr class='paused'>"+
                                "<td class='name' width='30%'><span title='"+this.name+"'>"+this.name+"</span></td>"+
                                "<td class='path' width='30%'><span title='"+path+"'>"+path+"</span></td>"+
                                "<td class='status' width='30%'>"+status+"</td>"+
                            "</tr>";
                }
            });
            var thead = "<thead><tr><th>"+eqFTPstrings.QUEUE_HEADER_NAME+"</th><th>"+eqFTPstrings.QUEUE_HEADER_PATH+"</th><th>"+eqFTPstrings.QUEUE_HEADER_STATUS+"</th></tr></thead>";
            var html = "<table>"+thead+trs+"</table>";
            $('#eqFTPQueueHolder .table-container').html(html);
        },
        toggleQueue: function() {
            if ($("#eqFTPQueueHolder").is(":visible")) {
                queuePanel = false;
                Resizer.hide($('#eqFTPQueueHolder'));
            } else {
                queuePanel = true;
                if(queuePanel) {
                    eqFTP.serviceFunctions.redrawQueue();
                }
                Resizer.show($('#eqFTPQueueHolder'));
            }
        },
        contextMenus: function() {
            /*
            * Creating Context Menus
            */

            var eqFTP_modalCmenu_file = Menus.registerContextMenu('equals182-eqftp-file_cmenu');
            eqFTP_modalCmenu_file.addMenuItem("eqftp.downloadFileAndOpen");
            eqFTP_modalCmenu_file.addMenuItem("eqftp.downloadFile");
            eqFTP_modalCmenu_file.addMenuItem("eqftp.addToPausedQueue-d");
            $("body").on('contextmenu', ".eqFTP-file", function (e) {
                tmp_modalClickedItem = $(this);
                if (e.which === 3) {
                    eqFTP_modalCmenu_file.open(e);
                }
            });

            var eqFTP_modalCmenu_folder = Menus.registerContextMenu('equals182-eqftp-folder_cmenu');
            eqFTP_modalCmenu_folder.addMenuItem("eqftp.downloadFile");
            eqFTP_modalCmenu_folder.addMenuItem("eqftp.addToPausedQueue-d");
            $("body").on('contextmenu', ".eqFTP-folder", function (e) {
                tmp_modalClickedItem = $(this);
                if (e.which === 3) {
                    eqFTP_modalCmenu_folder.open(e);
                }
            });

            var eqFTP_queueCmenu = Menus.registerContextMenu('equals182-eqftp-queue_cmenu');
            eqFTP_queueCmenu.addMenuItem("eqftp.startQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.pauseQueue");
            eqFTP_queueCmenu.addMenuDivider();
            eqFTP_queueCmenu.addMenuItem("eqftp.clearQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.clearComplitedQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.resetFailedQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.clearFailedQueue");
            $("body").on('contextmenu', "#eqFTPQueueHolder .table-container", function (e) {
                if (e.which === 3 && 
                    (
                        eqFTP.globals.pausedQueue.length > 0 || 
                        eqFTP.globals.automaticQueue.length > 0 ||
                        eqFTP.globals.successedQueue.length > 0 ||
                        eqFTP.globals.failedQueue.length > 0
                    ) 
                   ) {
                    eqFTP_queueCmenu.open(e);
                }
            });

            var project_contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU);
            project_contextMenu.addMenuDivider();
            project_contextMenu.addMenuItem("eqftp.addToAutomaticQueue-u");
            project_contextMenu.addMenuItem("eqftp.addToPausedQueue-u");
            
            var working_contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_MENU);
            working_contextMenu.addMenuDivider();
            working_contextMenu.addMenuItem("eqftp.addToAutomaticQueue-u");
            working_contextMenu.addMenuItem("eqftp.addToPausedQueue-u");
        },
        getLocalDirectory: function(params) {
            var dir = params.directoryObject;
            filesArray = [];
            var files = getLocalDirectoryRecursive(dir,function(files){
                var filesPaths = [];
                $.each(files,function() {
                    filesPaths.push({
                        localPath: this._path,
                        name: this._name,
                        direction: 'upload',
                        queue: params.queueType,
                        connectionID: params.connectionID
                    });
                });
                eqFTP.ftpFunctions.addToQueue(filesPaths);
            });
        },
        getRemoteDirectory: function(params) {
            var ftpPromise = nodeConnection.domains.eqFTP.getDirectory({
                paths: [eqFTP.serviceFunctions.normalizePath(params.path)],
                recursive: true,
                remoteRoot: eqFTP.globals.globalFtpDetails.ftp[eqFTP.globals.connectedServer].remotepath,
                connection: eqFTP.globals.globalFtpDetails.ftp[eqFTP.globals.connectedServer],
                downloadParams: {
                    connectionID: eqFTP.globals.connectedServer,
                    queue: params.queue,
                    direction: 'download'
                }
            });
        },
        contextLocalAddToQueue: function(params) {
            var fileEntry = ProjectManager.getSelectedItem();
            var queueType = params.queueType;
            if(fileEntry.isDirectory) {
                var localPath = fileEntry._path;
                if(ProjectManager.isWithinProject(localPath)) {
                    var projectRoot = ProjectManager.getProjectRoot();
                    eqFTP.serviceFunctions.getConnectionIDbyPath({
                        path: projectRoot._path,
                        callback: function(params) {
                            if(params.connectionID!==false) {
                                eqFTP.serviceFunctions.getLocalDirectory({
                                    directoryObject: fileEntry, 
                                    connectionID: params.connectionID, 
                                    queueType: queueType
                                });
                            }else{
                                console.error("[eqFTP] Uploding directory. There's no connectionID.");
                            }
                        }
                    });
                }else{
                    // Will probably never happen.
                    console.error("[eqFTP-test] I don't know how you did this but this is a separate folder. I mean this folder ins't within project. It's not possible.");
                }
            }else{
                var localPath = fileEntry._path;
                var name = fileEntry._name;
                if(ProjectManager.isWithinProject(localPath)) {
                    var projectRoot = ProjectManager.getProjectRoot();
                    var path = projectRoot._path;
                }else{
                    var path = localPath;
                    console.log("[eqFTP-test] This is a separate file.");
                }
                eqFTP.serviceFunctions.getConnectionIDbyPath({
                    path: path,
                    callback: function(params) {
                        if(params.connectionID!==false) {
                            if(params.tied==false) {
                                if(eqFTP.globals.clickedTreeElement!=0) {
                                    var t = $('li[data-bftControl="'+eqFTP.globals.clickedTreeElement+'"]:first');
                                    if($(t).length==1) {
                                        var d = $(t).find('div[data-path]:first');
                                        var path = d.attr('data-path');
                                        if(d.hasClass('eqFTP-folder')) {
                                            var remotePath = eqFTP.serviceFunctions.normalizePath(path+"/"+name);
                                        }else if(d.hasClass('eqfTP-file')) {
                                            var remotePath = eqFTP.serviceFunctions.normalizePath(FileSystem.getDirectoryForPath(path)+"/"+name);
                                        }
                                    }
                                }
                            }
                            eqFTP.ftpFunctions.addToQueue([
                                {
                                    localPath: localPath,
                                    remotePath: remotePath,
                                    name: name,
                                    direction: 'upload',
                                    queue: queueType,
                                    connectionID: params.connectionID
                                }
                            ]);
                        }else{
                            console.error("[eqFTP] Uploading file. There's no connectionID.");
                        }
                    }
                });
            }
        },
        getConnectionIDbyPath: function(params) {
            var f = false;
            var doThis = function(params) {
                $.each(eqFTP.globals.globalFtpDetails.ftp,function(i,o) {
                    if(
                        eqFTP.serviceFunctions.normalizePath(o.localpath + "/") == eqFTP.serviceFunctions.normalizePath(params.path + "/") || 
                        eqFTP.serviceFunctions.normalizePath(eqFTP.globals.globalFtpDetails.main.folderToProjects + "/" + o.connectionName + "/") == eqFTP.serviceFunctions.normalizePath(params.path + "/")
                    ) {
                        f = true;
                        if(params.callback) {
                            params.callback({
                                connectionID: i,
                                tied: true
                            });
                            return false;
                        }
                    }
                });
                if(f===false) {
                    if(eqFTP.globals.connectedServer!=null) {
                        params.callback({
                            connectionID: eqFTP.globals.connectedServer,
                            tied: false
                        });
                    }else{
                        //Dialogs.showModalDialog('DIALOG_ID_ERROR',eqFTPstrings.ERR_DIAG_NOSERVERFOUND_TITLE, eqFTPstrings.ERR_DIAG_NOSERVERFOUND_CONTENT);
                        params.callback({
                            connectionID: false,
                            tied: false
                        });
                    }
                }
            }
            if(eqFTP.globals.settingsLoaded==false) {
                eqFTP.readGlobalRemoteSettings(function(status) {
                    if(status) {
                        doThis(params);
                    }
                });
            }else{
                doThis(params);
            }
        }
    };
    
    eqFTP.getPassword = function(callback) {
        if(eqFTP.globals.masterPassword!=null) {
            return eqFTP.globals.masterPassword;
        }else{
            var dialog = Dialogs.showModalDialogUsingTemplate(eqFTPPasswordTemplate,true);
            dialog.done(function (id) {
                if(id='ok') {
                    var pass = dialog._$dlg[0].children[1].children[0].children[1].value;
                    eqFTP.globals.masterPassword = pass;
                    callback(pass);
                    return true;
                }else if(id=='close') {
                    callback(false);
                    return false;
                }
            });
            return false;
        }
    };
    
    eqFTP.processSettingsFile = function(params,callback) {
        if(eqFTP.globals.useEncryption==true) {
            if(params.text==undefined || params.text=="") {
                callback(params.text);
                return false;
            }else if(isJSON(params.text) && params.direction=='from') {
                callback(params.text);
                return params.text;
            }
            params.pass = eqFTP.globals.masterPassword;
            var doThis = function(params) {
                var t = nodeConnection.domains.eqFTP.eqFTPcrypto(params);
                t.done(function(result) {
                    callback(result);
                    return result;
                });
                t.fail(function(err) {
                    eqFTP.globals.masterPassword = null;
                    eqFTP.processSettingsFile(params,callback);
                    callback(false);
                    console.error(err);
                    return false;
                });
            }
            if(eqFTP.globals.masterPassword == null) {
                var passResult = eqFTP.getPassword(function(pass) {
                    if(pass) {
                        params.pass = pass;
                        return doThis(params);
                    }else{
                        eqFTP.globals.globalFtpDetails = {'main':{folderToProjects:defaultProjectsDir},'ftp':[]};
                        eqFTP.serviceFunctions.ftpLoaded(true);
                        callback(false);
                    }
                });
            }else{
                return doThis(params);
            }
        }else{
            callback(params.text);
            return params.text;
        }  
    };
    
    eqFTP.saveGlobalRemoteSettings = function() {
        var deferred = $.Deferred();
        eqFTP.globals.defaultSettingsPath = eqFTP.serviceFunctions.normalizePath(eqFTP.globals.defaultSettingsPath);
        var fileEntry = new FileSystem.getFileForPath(eqFTP.globals.defaultSettingsPath + "/" + eqFTP.globals.settingsFilename);
        var ftpData = JSON.stringify(eqFTP.globals.globalFtpDetails);
        eqFTP.processSettingsFile({text:ftpData,direction:'to'},function(result) {
            if(result) {
                FileUtils.writeText(fileEntry, result).done(function () {
                });
            }
        });
        return true;
    };
    
    eqFTP.readGlobalRemoteSettings = function(callback) {
        eqFTP.globals.defaultSettingsPath = eqFTP.serviceFunctions.normalizePath(eqFTP.globals.defaultSettingsPath);
        var fileEntry = new FileSystem.getFileForPath(eqFTP.globals.defaultSettingsPath + "/" + eqFTP.globals.settingsFilename);
        if (fileEntry) {
            var readSettingsPromise = FileUtils.readAsText(fileEntry);
            readSettingsPromise.done(function (result) {
                if (result) {
                    eqFTP.processSettingsFile({'text':result,'direction':'from'},function(result) {
                        if(result) {
                            eqFTP.globals.globalFtpDetails = $.parseJSON(result);
                            eqFTP.globals.settingsLoaded = true;
                        }
                        eqFTP.serviceFunctions.ftpLoaded(true);
                        if(isFunction(callback)) {
                            callback(result);
                        }
                    });
                }
            });
            readSettingsPromise.fail(function (err) {
                eqFTP.saveGlobalRemoteSettings();
            });
        }
    }
    
    eqFTP.showModal = function(e) {
        if($('#detachedModal').length<1) {
            $('body').append('<div id="detachedModalHolder"><div id="detachedModal"></div></div>');
            $('body').on('click',"#detachedModalHolder",function(e) {
                var t = e.target;
                var p = $(t).parents('#eqFTP-project-dialog');
                if(p.length!=1) {
                    eqFTP.globals.scrllTop = $('#eqFTP-project-dialog>.modal-body').scrollTop();
                    $('#detachedModalHolder').hide();
                    $('body').off('click','#detachedModalHolder',function(e) {});
                }
            });
        }
        var t = e.target;
        var width = 300;
        var height = 600;
        var gap = 20;
        var c_x = $(t).offset().left;
        var c_y = $(t).offset().top;
        
        var l = c_x - width - gap;
        var t = c_y - gap;
        
        $('#detachedModal').css('top',t).css('left',l).css('height',height).css('width',width);
        $('#detachedModal').html(eqFTPModalTemplate);
        $('#detachedModalHolder').show();
        $('#detachedModalHolder>#detachedModal>.modal').css('width',width);
        $('#eqFTPDirectoryListing').css('min-height',400);
        if(!isNaN(parseInt(eqFTP.globals.connectedServer))) {
            $('#eqFTPConnectionControl').addClass('on');
        }
        
        eqFTP.serviceFunctions.ftpLoaded(eqFTP.globals.ftpLoaded);
    }
    
    eqFTP.ftpFunctions = {
        changeDirectory: function(params) {
            eqFTP.globals.scrllTop = $('#eqFTP-project-dialog>.modal-body').scrollTop();
            if(isNaN(parseInt(eqFTP.globals.connectedServer))) {
                return false;
            }
            $("#eqFTP-filebrowser .table-container").toggleClass("loading");
            $("#eqFTP-filebrowser .table-container table").fadeOut(100);
            var ftp = eqFTP.globals.globalFtpDetails.ftp[eqFTP.globals.connectedServer];
            var shortPath = params.path;
            var paths = params.paths;
            if(paths!=undefined && paths.length>0) {
                var switchTo = paths;
            }else{
                var newPath = shortPath;
                console.log("[eqFTP] Changing directory to: "+newPath);    

                if(!newPath || newPath === "") {
                    newPath = "'eqFTP'root'";   
                    var tmpCurrentDirectoryArray = [];
                    newPath = eqFTP.serviceFunctions.normalizePath(newPath);
                }else{
                    newPath = eqFTP.serviceFunctions.normalizePath(newPath);
                    var tmp_path = newPath.replace(/(^\/|\/$)/gi,'');
                    tmpCurrentDirectoryArray = tmp_path.split("/");
                }

                var t = $('div[data-path="'+shortPath+'"]').parent();
                var ul = $(t).children('ul:first');
                
                if(!params.reload) {
                    if(t.hasClass('opened')) {
                        eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] = recursiveSearch({level:0,object:eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer],names:tmpCurrentDirectoryArray,state:'closed'});
                        t.removeClass('opened').addClass('closed');
                        return true;
                    }else if(ul.length>0){
                        eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] = recursiveSearch({level:0,object:eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer],names:tmpCurrentDirectoryArray,state:'opened'});
                        t.addClass('opened').removeClass('closed');
                        return true;
                    }
                }
                var switchTo = [newPath];
            }

            if (ftp.protocol === "sftp") {
                //var ftpPromise = nodeConnection.domains.eqFTP.getDirectorySFTP(eqFTP.globals.currentRemoteDirectory, ftp);
            } else {
                $('#eqFTPLoading').show();
                var ftpPromise = nodeConnection.domains.eqFTP.getDirectory({
                    paths: switchTo,
                    connection: ftp,
                    remoteRoot: ftp.remotepath,
                    replace: params.reload
                });
            }
        },
        addToQueue: function(arrayOfQueuers) {
            /*
            * @ params {object}:
            *   name    {string}
            *   connectionID    {integer}
            *   remotePath  {string}
            *   localPath   {string}
            *   status  {boolean}
            *   queue   {string}    ( automatic | paused )
            *   direction   {string}    ( download | upload )
            */
            $.each(arrayOfQueuers,function() {
                this.remotePath = eqFTP.serviceFunctions.normalizePath(this.remotePath);
                this.localPath = eqFTP.serviceFunctions.normalizePath(this.localPath);
                if(this.queue == 'automatic') {
                    eqFTP.globals.automaticQueue.unshift(this);
                }else if(this.queue == 'paused') {
                    eqFTP.globals.pausedQueue.unshift(this);
                }
            });
            eqFTP.ftpFunctions.startQueue();
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        },
        startQueue: function(params) {
            var doThis = function(params) {
                eqFTP.globals.processQueue = eqFTP.globals.automaticQueue;
                eqFTP.globals.automaticQueue = [];

                $.each(eqFTP.globals.processQueue,function(index,obj) {
                    if(!isNaN(parseInt(this.connectionID))) {
                        eqFTP.globals.processQueue[index].connection= eqFTP.globals.globalFtpDetails.ftp[this.connectionID];
                        if(this.direction=='download') {
                            var path = this.remotePath;
                            var pathArray = path.split("/");
                            var fileName = pathArray.pop();
                            if(eqFTP.globals.processQueue[index].connection.localpath=="") {
                                var root = eqFTP.globals.globalFtpDetails.main.folderToProjects + "/" + eqFTP.globals.processQueue[index].connection.connectionName;
                            }else{
                                var root = eqFTP.globals.processQueue[index].connection.localpath;
                            }
                            root = eqFTP.serviceFunctions.normalizePath(root);
                            eqFTP.globals.processQueue[index].remotePath = eqFTP.serviceFunctions.normalizePath(path);
                            eqFTP.globals.processQueue[index].localPath = eqFTP.serviceFunctions.normalizePath(root + "/" + pathArray.join("/") + "/");
                            eqFTP.globals.processQueue[index].remoteRoot = eqFTP.globals.globalFtpDetails.ftp[this.connectionID].remotepath;
                        }else if(this.direction=='upload') {
                            //console.log('[eqFTP-test] Params: '+JSON.stringify(obj));
                            if(!eqFTP.globals.globalFtpDetails.ftp[this.connectionID].connectToServerEvenIfDisconnected && this.connectionID != eqFTP.globals.connectedServer) {
                                console.warn("[eqFTP] You're not allowing me to upload files on this server when you're not connected to it.");
                                eqFTP.globals.failedQueue.unshift(eqFTP.globals.processQueue[index]);
                                eqFTP.globals.processQueue.splice(index, 1);
                            }else{
                                if(this.remotePath == undefined || this.remotePath == "") {
                                    if(ProjectManager.isWithinProject(this.localPath)) {
                                        var pathArray = ProjectManager.makeProjectRelativeIfPossible(this.localPath).split("/");
                                        pathArray.pop();
                                        var i = 0;
                                        var remoteRoot = eqFTP.globals.globalFtpDetails.ftp[this.connectionID].remotepath;
                                        var pathArrayString = pathArray.join('/');
                                    }else{
                                        pathArrayString = "";
                                    }
                                    eqFTP.globals.processQueue[index].remotePath = pathArrayString + "/" + this.name;
                                }
                                eqFTP.globals.processQueue[index].remotePath = eqFTP.serviceFunctions.normalizePath(eqFTP.globals.processQueue[index].remotePath);
                                eqFTP.globals.processQueue[index].localPath = eqFTP.serviceFunctions.normalizePath(eqFTP.globals.processQueue[index].localPath);
                                eqFTP.globals.processQueue[index].remoteRoot = remoteRoot;
                            }
                        }else{
                            eqFTP.globals.processQueue.splice(index, 1);
                        }
                    }else{
                        eqFTP.globals.processQueue.splice(index, 1);
                    }
                });
                nodeConnection.domains.eqFTP.queueControl({array: eqFTP.globals.processQueue});
                nodeConnection.domains.eqFTP.handleQueue();
            }
            if(eqFTP.globals.automaticQueue.length>0 && queuePaused==false) {
                queueBusy = true;
                if(eqFTP.globals.settingsLoaded==false) {
                    eqFTP.readGlobalRemoteSettings(function(status) {
                        if(status) {
                            doThis(params);
                        }else{
                            queueBusy = false;
                            queuePaused = false;
                            // Add connections abortion in future.
                        }
                    });
                }else{
                    doThis(params);
                }
            }else{
                queueBusy = false;
                if(eqFTP.globals.automaticQueue.length<1) {
                    queuePaused = false;
                }
            }
        }
    };
    
    /*
    *
    *
    ######################## Events ###############################
    *
    *
    */
    
    $('body').on('click','#eqFTP-openSettingsWindow',function() {
        eqFTP.serviceFunctions.showSettingsWindow({castWindow:true});
    });
    
    $('body').on('click','*[data-eqFTP-openSettings]',function() {
        if(!$(this).hasClass('clicked')){
            $('*[data-eqFTP-openSettings]').removeClass('clicked');
            $('*[data-eqFTP-addConnection]').removeClass('clicked');
            $('#eqFTPGlobalSettings').removeClass('clicked');
            $(this).addClass('clicked');
            
            $('#eqFTPSettingsHolder').show();
            $('#btfSettingsWindowsPlaceholder').hide();
            $('#eqFTPGlobalSettingsHolder').hide();
            var id = $(this).attr('data-eqFTP-openSettings');
            if(isNaN(parseInt(id))) {
                eqFTP.serviceFunctions.switchToMainSettings();
                return false;
            }
            var setting = eqFTP.globals.globalFtpDetails.ftp[id];
            
            $('#eqFTP-connectionName').val(setting.connectionName);
            $("#eqFTP-connectionID").val(id);
            $("#eqFTP-server").val(setting.server);
            $("#eqFTP-serverport").val(setting.port);
            $("#eqFTP-username").val(setting.username);
            $("#eqFTP-password").val(setting.password);
            $("#eqFTP-remoteroot").val(setting.remotepath);
            $('#eqFTP-localroot').val(setting.localpath);
            $("#eqFTP-protocol option").prop('selected', false);
            $("#eqFTP-protocol option[value=" + setting.protocol + "]").prop('selected', true);
            if (setting.uploadOnSave) {
                $("#eqFTP-uploadonsave").prop("checked", true);
            } else {
                $("#eqFTP-uploadonsave").prop("checked", false);
            }
            if (setting.connectToServerEvenIfDisconnected) {
                $("#eqFTP-connectToServerEvenIfDisconnected").prop("checked", true);
            } else {
                $("#eqFTP-connectToServerEvenIfDisconnected").prop("checked", false);
            }
        }
    });
    $('body').on('click','*[data-eqFTP-addConnection]',function() {
        if(!$(this).hasClass('clicked')){
            $('*[data-eqFTP-openSettings]').removeClass('clicked');
            $('*[data-eqFTP-addConnection]').removeClass('clicked');
            $('#eqFTPGlobalSettings').removeClass('clicked');
            $(this).addClass('clicked');
            
            $('#eqFTPSettingsHolder').show();
            $('#btfSettingsWindowsPlaceholder').hide();
            $('#eqFTPGlobalSettingsHolder').hide();
            var id = $(this).attr('data-eqFTP-addConnection');
            var setting = eqFTP.globals.globalFtpDetails.ftp[id];

            $('#eqFTP-connectionName').val('');
            $("#eqFTP-connectionID").val(id);
            $("#eqFTP-server").val('');
            $("#eqFTP-serverport").val('21');
            $("#eqFTP-username").val('');
            $("#eqFTP-password").val('');
            $("#eqFTP-remoteroot").val('');
            $('#eqFTP-localroot').val('');
            $("#eqFTP-connectToServerEvenIfDisconnected").prop('checked',false);
            $("#eqFTP-protocol option").prop('selected', false);
            $("#eqFTP-protocol option[value=FTP]").prop('selected', true);
            $("#eqFTP-uploadonsave").prop("checked", false);
        }
    });
    
    $('body').on('click','#eqFTPGlobalSettings',function() {
        eqFTP.serviceFunctions.switchToMainSettings();
    });
    
    $('body').on('click','#eqFTPSettingsRefresh',function() {
        eqFTP.globals.masterPassword = null;
        eqFTP.globals.settingsLoaded = false;
        eqFTP.readGlobalRemoteSettings();
    });
    
    $('body').on('change','#eqFTP-serverChoosing',function() {
        eqFTP.globals.scrllTop = 0;
        eqFTP.globals.clickedTreeElement = 0;
        var id = parseInt($(this).val());
        if(isNaN(id)) { id = null; }
        eqFTP.globals.connectedServer = id;
        var defaultLocalRoot = eqFTP.globals.globalFtpDetails.main.folderToProjects;
        eqFTP.globals.currentLocalRoot = defaultLocalRoot;
        if(eqFTP.globals.globalFtpDetails.ftp[id].localpath!="") {
            eqFTP.globals.currentLocalRoot = eqFTP.globals.globalFtpDetails.ftp[id].localpath;
        }
        eqFTP.ftpFunctions.changeDirectory({path:""});
        $('#eqFTPConnectionControl').addClass('on');
    });
    
    $('body').on('click','.eqFTPFileTreeCell',function() {
        $('.eqFTPFileTreeCell').removeClass('clicked');
        var p = $(this).parent();
        p.find('>div').addClass('clicked');
        var id = p.attr('data-bftControl');
        eqFTP.globals.clickedTreeElement = id;
    });
    
    $('body').on('click','#eqFTPDirectoryListing',function(e) {
        var t = e.target;
        if(!$(t).is('#eqFTPTable') && $(t).parents('#eqFTPTable:first').length<1) {
            eqFTP.globals.clickedTreeElement = 0;
            $('.eqFTPFileTreeCell').removeClass('clicked');
        }
    });
    
    $('body').on('click','#eqFTPConnectionControl',function() {
        if(!isNaN(parseInt(eqFTP.globals.connectedServer))) {
            eqFTP.globals.connectedServer = null;
            $(this).removeClass('on');
            $('#eqFTPTable').html('');
        }else{
            var id = parseInt($('#eqFTP-serverChoosing').val());
            if(isNaN(id)) {
                eqFTP.globals.connectedServer = null;
                nodeConnection.domains.eqFTP.quit();
            }else{
                eqFTP.globals.connectedServer = id;
                $(this).addClass('on');
                eqFTP.serviceFunctions.redrawFileTree();
            }
        }
    });
    
    $('body').on('click','#eqFTPRefresh',function() {
        if(!isNaN(parseInt(eqFTP.globals.connectedServer))) {
            recursiveSearch2({
                searchIn: eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer],
                state: "opened",
                callback: function(paths) {
                    eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] = [];
                    eqFTP.ftpFunctions.changeDirectory({paths:paths, reload:true});
                }
            });
        }
    });
    
    $('body').on('click','.eqFTP-icon-close',function() {
        var id = parseInt($(this).parent().attr('data-eqFTP-openSettings'));
        if(!isNaN(id)) {
            var r=confirm(eqFTPstrings.SETTINGSWIND_DELETECONNCONF_1+'"'+eqFTP.globals.globalFtpDetails.ftp[id].connectionName+'"'+eqFTPstrings.SETTINGSWIND_DELETECONNCONF_2);
            if (r==true) {
                eqFTP.globals.globalFtpDetails.ftp.splice(id,1);
                eqFTP.saveGlobalRemoteSettings();
                eqFTP.serviceFunctions.triggerSettingsNotification({type:"notification",state:true,text:eqFTPstrings.SETTINGSWIND_NOTIF_DONE});
                eqFTP.serviceFunctions.showSettingsWindow();
                eqFTP.serviceFunctions.switchToMainSettings();
            }
        }
    });
    
    $('body').on('click','#eqFTPButtonApply',function() {
        eqFTP.serviceFunctions.triggerSettingsNotification({type:"notification",state:false});
        eqFTP.serviceFunctions.triggerSettingsNotification({type:"error",state:false});
        var tmp_connectionID = $("#eqFTP-connectionID").val();
        if(tmp_connectionID!='no') {
            if( eqFTPCheckField('#eqFTP-connectionName')==false ||
                eqFTPCheckField('#eqFTP-server') == false ||
                eqFTPCheckField('#eqFTP-username') == false ||
                eqFTPCheckField('#eqFTP-password') == false
              ){
                return false;
            }
            if(!isNaN(parseInt(tmp_connectionID))) {
                var tmp_connectionName = $('#eqFTP-connectionName').val();
                var tmp_server = $("#eqFTP-server").val();
                var tmp_serverport = $("#eqFTP-serverport").val();
                var tmp_username = $("#eqFTP-username").val();
                var tmp_password = $("#eqFTP-password").val();
                var tmp_remoteroot = $("#eqFTP-remoteroot").val();
                var tmp_protocol = $("#eqFTP-protocol").val();
                
                var tmp_connectToServerEvenIfDisconnected = false;
                if($("#eqFTP-connectToServerEvenIfDisconnected").is(':checked')) {
                    var tmp_connectToServerEvenIfDisconnected = true;
                }
                var tmp_uploadonsave = false;
                if($("#eqFTP-uploadonsave").is(':checked')) {
                    var tmp_uploadonsave = true;
                }
                
                var tmp_localroot = $("#eqFTP-localroot").val();
                var tmp = {
                    connectionName: tmp_connectionName,
                    server: tmp_server,
                    protocol: tmp_protocol,
                    port: tmp_serverport,
                    username: tmp_username,
                    password: tmp_password,
                    localpath: tmp_localroot,
                    remotepath: tmp_remoteroot,
                    uploadOnSave: tmp_uploadonsave,
                    connectToServerEvenIfDisconnected: tmp_connectToServerEvenIfDisconnected
                };
                eqFTP.globals.globalFtpDetails.ftp[tmp_connectionID] = tmp;
            }
        }
        
        if($('#eqFTP-SettingsFolder').val()!="") {
            eqFTP.globals.prefs.set('defaultSettingsPathPref',$('#eqFTP-SettingsFolder').val());
        }else{
            eqFTP.globals.prefs.set('defaultSettingsPathPref',defaultProjectsDir);
        }
        if($('#eqFTP-useEncryption').is(':checked')) {
            eqFTP.globals.prefs.set('useEncryption',true);
        }else{
            eqFTP.globals.masterPassword = null;
            eqFTP.globals.prefs.set('useEncryption',false);
        }
        eqFTP.globals.prefs.save();
        
        eqFTP.globals.globalFtpDetails.main.folderToProjects = $("#eqFTP-ProjectsFolder").val();
        eqFTP.globals.globalFtpDetails.main.noProjectOnDownload = false;
        if($("#eqFTP-noProjectOnDownload").is(':checked')) {
            eqFTP.globals.globalFtpDetails.main.noProjectOnDownload = true;
        }
        
        var tmp = eqFTP.saveGlobalRemoteSettings();
        if(tmp==true) {
            eqFTP.serviceFunctions.triggerSettingsNotification({type:"notification",state:true,text:eqFTPstrings.SETTINGSWIND_NOTIF_DONE});
            eqFTP.serviceFunctions.showSettingsWindow();
            eqFTP.serviceFunctions.redrawRemoteModalServerList();
        }else{
            eqFTP.serviceFunctions.triggerSettingsNotification({type:"error",state:true,text:eqFTPstrings.SETTINGSWIND_ERR_CANTWRITE});
        }
    });
    
    $("body").on('click','.eqFTPUseDirectoryOpener',function() {
        var t = $(this);
        var tmp_dpath = eqFTP.serviceFunctions.normalizePath(t.val());
        FileSystem.showOpenDialog(false,true,t.attr('data-eqFTP_ODT'),tmp_dpath,null,function(str, arr){
            t.val(arr[0]);
        });
    });
    
    $("body").on("click", "#eqFTPautolocalpath", function() {
        var projectRoot = ProjectManager.getProjectRoot();
        projectRoot = projectRoot._path;
        var f = false;
        var n = $('#eqFTP-connectionName').val();
        $.each(eqFTP.globals.globalFtpDetails.ftp,function() {
            if(
                (this.localpath == projectRoot || eqFTP.serviceFunctions.normalizePath(eqFTP.globals.globalFtpDetails.main.folderToProjects + "/" + this.connectionName + "/") == projectRoot)
                && this.connectionName != n
            ) {
                f = true;
            }
        });
        if(f) {
            eqFTP.serviceFunctions.triggerSettingsNotification({type:"error",state:true,text:eqFTPstrings.SETTINGSWIND_ERR_LOCALPATHREPEAT});
        }else{
            $("#eqFTP-localroot").val(projectRoot);
        }
    });

    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/eqFTP-styles.css");
        
        //********************************
        //****** Set Up UI Elements ******
        //********************************
        
        $("#main-toolbar .buttons").append(eqFTPToolbarTemplate);
        
        $("#toolbar-eqFTP").on('click', function (e) {
            // showSettingsDialog();
            if(!$(this).hasClass('disabled')) {
                eqFTP.readGlobalRemoteSettings();
                eqFTP.showModal(e);
            }
        });
        
        $("body").on('dblclick', ".eqFTP-folder", function () {
            eqFTP.ftpFunctions.changeDirectory({path:$(this).attr("data-path")});
        });
        
        $("body").on('click', ".eqFTPFileTreePlusMinus", function () {            
            eqFTP.ftpFunctions.changeDirectory({path:$(this).parent().attr("data-path")});
        });
        
        $("body").on('dblclick', ".eqFTP-file", function () {            
            var name = $(this).find('.eqFTPModalItemTitle:first').text();
            eqFTP.ftpFunctions.addToQueue([
                {
                    remotePath: $(this).attr("data-path"),
                    name: name,
                    direction: 'download',
                    queue: 'automatic',
                    openAfter: true,
                    connectionID: eqFTP.globals.connectedServer
                }
            ]);
        });
        
        /*
        * Preparing Context Menus' commands
        */

        CommandManager.register(eqFTPstrings.CONTEXTM_DOWNLOAD, "eqftp.downloadFile", function() { 
            var name = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first').text();
            var remotePath = tmp_modalClickedItem.attr('data-path');
            if(tmp_modalClickedItem.hasClass('eqFTP-folder')) {
                // Folder
                eqFTP.serviceFunctions.getRemoteDirectory({
                    path: remotePath,
                    queue: 'automatic'
                });
            }else if(tmp_modalClickedItem.hasClass('eqFTP-file')) {
                // File
                eqFTP.ftpFunctions.addToQueue([
                    {
                        remotePath: remotePath,
                        name: name,
                        direction: 'download',
                        queue: 'automatic',
                        connectionID: eqFTP.globals.connectedServer
                    }
                ]);
            }
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_OPEN, "eqftp.downloadFileAndOpen", function() { 
            var name = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first').text();
            var remotePath = tmp_modalClickedItem.attr('data-path');
            eqFTP.ftpFunctions.addToQueue([
                {
                    remotePath: remotePath,
                    name: name,
                    direction: 'download',
                    queue: 'automatic',
                    openAfter: true,
                    connectionID: eqFTP.globals.connectedServer
                }
            ]);
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_ADDQUEUE, "eqftp.addToPausedQueue-d", function() {
            var remotePath = tmp_modalClickedItem.attr('data-path');
            var name = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first').text();
            if(tmp_modalClickedItem.hasClass('eqFTP-folder')) {
                // Folder
                eqFTP.serviceFunctions.getRemoteDirectory({
                    path: remotePath,
                    queue: 'paused'
                });
            }else if(tmp_modalClickedItem.hasClass('eqFTP-file')) {
                // File
                eqFTP.ftpFunctions.addToQueue([
                    {
                        remotePath: remotePath,
                        name: name,
                        direction: 'download',
                        queue: 'paused',
                        connectionID: eqFTP.globals.connectedServer
                    }
                ]);
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_STARTQ, "eqftp.startQueue", function() {
            queuePaused = false;
            var tmpQ = [];
            $.each(eqFTP.globals.pausedQueue, function() {
                this.queue = "automatic";
                tmpQ.push(this);
            });
            nodeConnection.domains.eqFTP.queueControl({action:"pause",pause:queuePaused});
            eqFTP.ftpFunctions.addToQueue(tmpQ);
            eqFTP.globals.pausedQueue = [];
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_PAUSEQ, "eqftp.pauseQueue", function() { 
            queuePaused = true;
            nodeConnection.domains.eqFTP.queueControl({action:"pause",pause:queuePaused});
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_CLEARQ, "eqftp.clearQueue", function() { 
            eqFTP.globals.pausedQueue = [];
            eqFTP.globals.automaticQueue = [];
            eqFTP.globals.successedQueue = [];
            eqFTP.globals.failedQueue = [];
            eqFTP.globals.processQueue = [];
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
            nodeConnection.domains.eqFTP.queueControl({action:"clear"});
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_CLEARCOMPQ, "eqftp.clearComplitedQueue", function() { 
            eqFTP.globals.successedQueue = [];
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_CLEARFAILQ, "eqftp.clearFailedQueue", function() { 
            eqFTP.globals.failedQueue = [];
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_RESTARTFAILQ, "eqftp.resetFailedQueue", function() {
            $.each(eqFTP.globals.failedQueue,function(i,e) {
                eqFTP.globals.failedQueue[i].queue = "automatic";
            });
            eqFTP.ftpFunctions.addToQueue(eqFTP.globals.failedQueue);
            eqFTP.globals.failedQueue = [];
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });        
        CommandManager.register(eqFTPstrings.CONTEXTM_ADDQUEUE, "eqftp.addToPausedQueue-u", function() {
            eqFTP.serviceFunctions.contextLocalAddToQueue({
                queueType: 'paused'
            });
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_UPLOAD, "eqftp.addToAutomaticQueue-u", function() {
            eqFTP.serviceFunctions.contextLocalAddToQueue({
                queueType: 'automatic'
            });
        });        

        /*
        * Creating Queue Manager
        */
        
        var eqFTPQueue = PanelManager.createBottomPanel("eqFTP.eqFTPQueue", $(eqFTPQueueTemplate), 200);
        
        var eqFTPQueueButton = "<div id='eqFTPQueueIndicator' title='"+eqFTPstrings.QUEUE_TITLE_HOVER+"' class='disabled'>"+eqFTPstrings.QUEUE_TITLE+"</div>";
        $(eqFTPQueueButton).insertBefore("#status-language");
        StatusBar.addIndicator('eqFTPQueueIndicator', $("#eqFTPQueueIndicator"), true);
                
        $("body").on("click", "#eqFTPQueueHolder .close", function () {
            eqFTP.serviceFunctions.toggleQueue();
        });
        
        $("body").on("click", "#eqFTPQueueIndicator", function () {
            if(eqFTP.globals.ftpLoaded == true) {
                eqFTP.serviceFunctions.toggleQueue();
            }
        });
    });
    
    AppInit.appReady(function () {
        
        nodeConnection = new NodeConnection();
        
        function connectNode() {
            var connectionPromise = nodeConnection.connect(true);
            connectionPromise.fail(function (err) {
                
            });
            return connectionPromise;
        }
        
        function loadNodeFtp() {
            var path = ExtensionUtils.getModulePath(module, "node/ftpDomain");
            var loadPromise = nodeConnection.loadDomains([path], true);
            loadPromise.fail(function (err) {
                console.error(err);
                eqFTP.serviceFunctions.ftpLoaded(false);
            });
            loadPromise.done(function (done) {
                console.log("[eqFTP] Loaded");
                eqFTP.serviceFunctions.ftpLoaded(true);
                eqFTP.serviceFunctions.contextMenus(true);
            });
            return loadPromise;
        }
        
        chain(connectNode, loadNodeFtp);
        
        $(nodeConnection).on("eqFTP.getDirectorySFTP", function (event, result) {
            console.log(result);
        });
        
        $(nodeConnection).on("eqFTP.getDirectory", function (event, result) {
            if(result.err) {
                eqFTP.serviceFunctions.redrawFileTree();
                $('#eqFTPLoading').hide();
            }else{
                var files = JSON.parse(result.files);
                var sanitizedFolders = new Array();
                var sanitizedFiles = new Array();

                //Get all files
                $.each(files, function (index, value) {
                    if (value !== null) {
                        if (value.type === 0) {
                            var date = eqFTP.serviceFunctions.convertDate({input:value.time,type:'full'});
                            var dateShort = eqFTP.serviceFunctions.convertDate({input:value.time,type:'short'});
                            var sizeShort = eqFTP.serviceFunctions.shortenFilesize({input:value.size,type:'short'});
                            var fileObject = {
                                name: value.name,
                                lastupdatedShort: dateShort,
                                lastupdated: date,
                                sizeShort : sizeShort,
                                size: value.size,
                                type: "file",
                            };

                            sanitizedFiles.push(fileObject);
                        }
                    }
                });

                //Get all folders
                $.each(files, function (index, value) {
                    if (value !== null) {
                        if (value.type === 1) {  
                            var date = eqFTP.serviceFunctions.convertDate({input:value.time,type:'full'});
                            var dateShort = eqFTP.serviceFunctions.convertDate({input:value.time,type:'short'});
                            var fileObject = {
                                name: value.name,
                                lastupdatedShort: dateShort,
                                lastupdated: date,
                                size: "",
                                sizeShort : "",
                                type: "folder",
                                children: {},
                            };

                            sanitizedFolders.push(fileObject);
                        }
                    }
                });

                var thisFolderStructure = sanitizedFolders.concat(sanitizedFiles);
                //console.log("[eqFTP] Got folder structure: "+JSON.stringify(thisFolderStructure)); 
                var tmpCRD = result.path;
                var tmpRP = eqFTP.globals.globalFtpDetails.ftp[eqFTP.globals.connectedServer].remotepath;
                var tmpCurrentDirectoryArray = [];
                if(tmpCRD!=="'eqFTP'root'" && tmpCRD!=="" && tmpCRD!=="/") {
                    tmpCRD = eqFTP.serviceFunctions.normalizePath(tmpCRD);
                    var tmp_path = tmpCRD.replace(/(^\/|\/$)/gi,'');
                    tmpCurrentDirectoryArray = tmp_path.split("/");
                }
                if(eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer]==undefined) {
                    eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] = [];
                }
                eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] = recursiveSearch({
                    level:      0,
                    object:     eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer],
                    names:      tmpCurrentDirectoryArray,
                    addFolder:  thisFolderStructure,
                    state:      'opened',
                    replace:    result.replace
                });
                if(result.last) {
                    eqFTP.serviceFunctions.redrawFileTree();
                    $('#eqFTPLoading').hide();
                }
            }
        });
        
        $(nodeConnection).on("eqFTP.transferProgress", function (event, params) {
            var data = params.data;
            $.each(eqFTP.globals.processQueue, function(index, t) {
                var tmprp = eqFTP.serviceFunctions.normalizePath(this.remoteRoot + "/" + this.remotePath);
                if(this.localPath == data.filename || tmprp == data.filename) {
                    eqFTP.globals.processQueue[index].transferData = data;
                }
            });
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        
        $(nodeConnection).on("eqFTP.getDirectoryRecursive", function (event, params) {
            if(params.err==null) {
                eqFTP.ftpFunctions.addToQueue(params.files);
            }
        });
                
        $(nodeConnection).on("eqFTP.otherEvents", function (event, params) {
            if(params.event=='connectError') {
                if(params.err.code=="ENOTFOUND") {
                    Dialogs.showModalDialog('DIALOG_ID_ERROR',eqFTPstrings.ERR_DIAG_SERVNOEXIST_TITLE, eqFTPstrings.ERR_DIAG_SERVNOEXIST_CONTENT);
                }else if(params.err.code=="EACCES") {
                    Dialogs.showModalDialog('DIALOG_ID_ERROR',eqFTPstrings.ERR_DIAG_SERVCANTREACH_TITLE, eqFTPstrings.ERR_DIAG_SERVCANTREACH_CONTENT);
                }else if(params.err.code=="ECONNRESET") {
                    Dialogs.showModalDialog('DIALOG_ID_ERROR',eqFTPstrings.ERR_DIAG_ECONNRESET_TITLE, eqFTPstrings.ERR_DIAG_ECONNRESET_CONTENT);
                }else{
                    Dialogs.showModalDialog('DIALOG_ID_ERROR',eqFTPstrings.ERR_DIAG_UNIVERSAL_TITLE, eqFTPstrings.ERR_DIAG_UNIVERSAL_CONTENT+"<br>"+JSON.stringify(params.err));
                }
            }else if(params.event="authError") {
                Dialogs.showModalDialog('DIALOG_ID_ERROR',eqFTPstrings.ERR_DIAG_AUTHORIZEERR_TITLE, eqFTPstrings.ERR_DIAG_AUTHORIZEERR_CONTENT);
            }
            $('#eqFTPLoading').hide();
        });

        $(nodeConnection).on("eqFTP.queueEvent", function (event, params) {
            var item = eqFTP.globals.processQueue.shift();
            if(params.status == "queueDone") {
                queueBusy = false;
                if(eqFTP.globals.automaticQueue.length<1) {
                    queuePaused = false;
                }
                $("#toolbar-eqFTP").addClass("complete");
                var toolbarResetTimeout = setInterval(function () {
                    $("#toolbar-eqFTP").removeClass("complete");
                    clearInterval(toolbarResetTimeout);
                }, 2000);
            }else if(params.status == "uploadComplete") {
                /*var path = FileUtils.getDirectoryPath(item.remotePath);
                eqFTP.ftpFunctions.changeDirectory({path:"//"+path, reload:true});*/
                eqFTP.globals.successedQueue.unshift(item);
            }else if(params.status == "downloadComplete") {
                if(params.element.openAfter) {
                    if(eqFTP.globals.globalFtpDetails.main.noProjectOnDownload==false) {
                        var root = "";
                        var localArray = params.element.localPath.split("/");
                        var remoteArray = params.element.remotePath.split("/");
                        remoteArray.pop();
                        remoteArray.reverse();
                        localArray.reverse();
                        $.each(localArray,function() {
                            if(localArray[0]!=undefined && localArray[0].trim()==""){
                                localArray.shift();
                            }
                            if(remoteArray[0]!=undefined && remoteArray[0].trim()==""){
                                remoteArray.shift();
                            }
                            if(remoteArray.length<1) {
                                localArray.reverse();
                                root = localArray.join("/");
                                return false;
                            }
                            var ratmp = remoteArray.shift();
                            if(ratmp==localArray[0]) {
                                localArray.shift();
                            }
                        });
                        var currentProjectRoot = ProjectManager.getProjectRoot();
                        if(currentProjectRoot._path==root+"/") {
                            eqFTP.serviceFunctions.tryOpenFile(params.element.localPath+params.element.name);
                        }else{
                            var openFolderPromise = ProjectManager.openProject(root);
                            openFolderPromise.done(function() {
                                eqFTP.serviceFunctions.tryOpenFile(params.element.localPath+params.element.name);
                            });
                            openFolderPromise.fail(function() {
                            });
                        }
                    }else{
                        eqFTP.serviceFunctions.tryOpenFile(params.element.localPath+params.element.name);
                    }
                }
                eqFTP.globals.successedQueue.unshift(item);
            }else if(params.status == "uploadError") {
                eqFTP.globals.failedQueue.unshift(item);
            }else if(params.status == "downloadError") {
                item.status = eqFTPstrings.OTHER_ERROR+" "+params.element.status.code+".";
                if(params.element.status.code==550) {
                    item.status += " "+eqFTPstrings.ERR_FILE_ACCESSDENIED;
                }
                eqFTP.globals.failedQueue.unshift(item);
            }else if(params.status == "downloadFilesize0") {
                eqFTP.globals.failedQueue.unshift(item);
            }else if(params.status == "authError") {
                item.status = eqFTPstrings.ERR_FILE_AUTHORIZATION;
                eqFTP.globals.failedQueue.unshift(item);
            }else if(params.status == "connectError") {
                if(params.err.code=="ENOTFOUND") {
                    item.status = eqFTPstrings.ERR_FILE_SERVNOEXIST;
                }else if(params.err.code=="EACCES") {
                    item.status = eqFTPstrings.ERR_FILE_SERVCANTREACH;
                }
                eqFTP.globals.failedQueue.unshift(item);
            }
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        
    });
    
    $(DocumentManager).on("beforeDocumentDelete", function(event, doc) {
        var delId = doc.file._id;
        eqFTP.serviceFunctions.updateOpenedFiles({action:"delete",id:delId});
    });
    
    $(DocumentManager).on("documentSaved", function (event, doc) {
        var fileid = doc.file._id;
        var document = DocumentManager.getCurrentDocument();
        if(ProjectManager.isWithinProject(document.file.fullPath)) {
            var projectRoot = ProjectManager.getProjectRoot();
            eqFTP.serviceFunctions.getConnectionIDbyPath({
                path: projectRoot._path,
                callback: function(params) {
                    if(params.connectionID!==false) {
                        var connectionID = params.connectionID;
                        var doUpload = function() {
                            var document = DocumentManager.getCurrentDocument();
                            var name = document.file.name;
                            if(eqFTP.globals.globalFtpDetails.ftp[connectionID].server !== "") {   
                                if (eqFTP.globals.globalFtpDetails.ftp[connectionID].uploadOnSave === true) {
                                    var tmp_queuetype = "automatic";
                                }else{
                                    var tmp_queuetype = "paused";
                                }
                                if(eqFTP.globals.globalFtpDetails.ftp[connectionID].connectToServerEvenIfDisconnected==true || connectionID==eqFTP.globals.connectedServer) {
                                    eqFTP.ftpFunctions.addToQueue([
                                        {
                                            localPath: document.file.fullPath,
                                            name: name,
                                            direction: 'upload',
                                            queue: tmp_queuetype,
                                            connectionID: connectionID
                                        }
                                    ]);
                                }
                            }else{
                                console.log('[eqFTP-test] Everythings ok, except your server field is empty.');
                            }
                        }
                        if(eqFTP.globals.globalFtpDetails.ftp[connectionID]==undefined) {
                            eqFTP.readGlobalRemoteSettings(doUpload);
                        }else{
                            doUpload();
                        }
                    }else{
                        console.log("[eqFTP] Upload on save. There's no connectionID.");
                    }
                }
            });
        }else if(typeof eqFTP.globals.currentDownloadedDocuments[fileid] === "object" && eqFTP.globals.currentDownloadedDocuments[fileid]!="undefined") {
            var remotePath = eqFTP.globals.currentDownloadedDocuments[fileid].path;
            var connectionID = eqFTP.globals.currentDownloadedDocuments[fileid].connectionID;
            var name = document.file.name;
            eqFTP.ftpFunctions.addToQueue([
                {
                    localPath: document.file.fullPath,
                    name: name,
                    remotePath: remotePath,
                    direction: 'upload',
                    queue: "automatic",
                    connectionID: connectionID
                }
            ]);
        }
    });    
});
