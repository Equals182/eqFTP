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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache, brackets, window */


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
        FileSystem = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        FileSystemTrue  = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        Strings = brackets.getModule("strings"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        BracketsFTPToolbar = require("text!htmlContent/eqFTP-toolbar.html"),
        BracketsFTPRemoteModal = require("text!htmlContent/eqFTP-modal.html"),
        BracketsFTPSettings = require("text!htmlContent/eqFTP-settings.html");
        
    var globalFtpDetails = {'main':{folderToProjects:"C:\\Brackets Projects"},'ftp':[]};

    var remoteStructure = [];
    var currentRemoteRoot = "";
    var currentLocalRoot = "";
    var connectedServer = null;
    var currentDownloadedDocuments = [];
    
    var settingsFilename = ".remotesettings";
    var eqFTPNoteFilename = ".eqFTP-note";
    var currentRemoteDirectory;    

    var defaultSettingsPath = ExtensionUtils.getModulePath(module);
    var prefs = PreferencesManager.getExtensionPrefs("eqFTP");
    prefs.definePreference("defaultSettingsPath", "string", defaultSettingsPath);
    var tmp_defaultSettingsPath = prefs.get("defaultSettingsPath");
    if(tmp_defaultSettingsPath!=undefined && tmp_defaultSettingsPath!="") {
        defaultSettingsPath=tmp_defaultSettingsPath;
    }
    prefs.on("change", function () {
        defaultSettingsPath = prefs.get("defaultSettingsPath");
    });
    var fileBrowserResults = '#eqFTPDirectoryListing';
    var ftpLoaded = 0;
    
    /**
    *
    *
    ######################## Global functions ###############################
    *
    *
    */
    
    function changeeqFTPProjectNote(params) {
        if(params.action === "write") {
            var fileEntry = new FileSystem.FileEntry(params.path + "/" + eqFTPNoteFilename);
            var jsonData = JSON.stringify(params.data);
            var readSettingsPromise = FileUtils.writeText(fileEntry, jsonData).done(function () {

            });
        }else if(params.action === "delete") {
            var fileEntry = new FileSystem.FileEntry(params.path + eqFTPNoteFilename);
            if (fileEntry) {
                var jsonData = JSON.stringify(params.data);
                var readSettingsPromise = FileUtils.writeText(fileEntry, jsonData).done(function () {

                });
            }
        }else if(params.action === "read") {
            var fileEntry = new FileSystem.FileEntry(params.path + eqFTPNoteFilename);
            if (fileEntry) {
                var readSettingsPromise = FileUtils.readAsText(fileEntry);
            }else{
                return false;
            }
        }
        return readSettingsPromise;
    }

    function normalizePath(input) {
        var tmp = input.replace(/\\+/g,'/');
        tmp = tmp.replace(/\/\/+/g,'/');
        return tmp;
    }
    
    function eqFTPRedrawRemoteModalServerList() {
        $('#eqFTP-serverChoosing').html('');
        $('#eqFTP-serverChoosing').append('<option disabled selected value="">Select Remote Server to Connect...</option><option disabled>------------------------------</option>');
        var i=0;
        $.each(globalFtpDetails.ftp,function() {
            var t = this;
            $('#eqFTP-serverChoosing').append('<option value="'+i+'">'+t.connectionName+'</option>');
            i++;
        });
        var tmp_connectedServer = parseInt(connectedServer);
        if(!isNaN(tmp_connectedServer)) {
            $('#eqFTP-serverChoosing option').prop('selected',false);
            $('#eqFTP-serverChoosing option[value='+tmp_connectedServer+']').prop('selected',true);
        }
    }
        
    function triggerError(params) {
        var state = params.state;
        if(state == 0 || state == false) {
            $('#eqFTP-errorMessage').addClass('hide');
            return true;
        }else{
            $('#eqFTP-errorMessage').removeClass('hide');
        }
        var text = params.text;
        $('#eqFTP-errorMessage').text(text);
    }

    function triggerNotification(params) {
        var state = params.state;
        if(state == 0 || state == false) {
            $('#eqFTP-notificationMessage').addClass('hide');
            return true;
        }else{
            $('#eqFTP-notificationMessage').removeClass('hide');
        }
        var text = params.text;
        $('#eqFTP-notificationMessage').text(text);
    }
    
    function convertDate(params) {
        var fullDate = new Date(params.input);
        if(params.type=='full') {
            var r = fullDate.toUTCString();
        }else if(params.type=='short') {
            var tf = globalFtpDetails.main.timeFormat;
            
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
    }
    
    function shortenFilesize(params) {
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
    };
    
    function getSettings() {
        $('#bracketsftpAllServerList').html('');
        var i=0;
        $.each(globalFtpDetails.ftp,function() {
            var t = this;
            $('#bracketsftpAllServerList').append('<li data-eqFTP-openSettings="'+i+'"><i class="eqFTP-icon-close eqFTP-icon" style="vertical-align:middle; margin-right:5px; margin-left:-10px;" title="Delete This Connection"></i>'+t.connectionName+'</li>');
            i++;
        });
        $('#bracketsftpAllServerList').append('<li data-eqFTP-addConnection="'+globalFtpDetails.ftp.length+'"><i class="eqFTP-icon-plus eqFTP-icon" style="vertical-align:middle; margin-right:5px; margin-left:-10px;" title="Add New Connection"></i>Create New Connection...</li>');
        var id = parseInt($('#eqFTP-connectionID').val());
        if(!isNaN(id)) {
            $('*[data-eqFTP-opensettings='+id+']').addClass('clicked');
        }
        $('#eqFTP-ProjectsFolder').val(globalFtpDetails.main.folderToProjects);
        if(globalFtpDetails.main.noProjectOnDownload==true) {
            $('#eqFTP-noProjectOnDownload').prop('checked',true);
        }else{
            $('#eqFTP-noProjectOnDownload').prop('checked',false);
        }
        $('#eqFTP-SettingsFolder').val(defaultSettingsPath);
    }
    
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
    
    function saveGlobalRemoteSettings() {
        var deferred = $.Deferred();
        defaultSettingsPath = normalizePath(defaultSettingsPath);
        var fileEntry = new FileSystem.FileEntry(defaultSettingsPath + "/" + settingsFilename);
        var ftpData = JSON.stringify(globalFtpDetails);
        FileUtils.writeText(fileEntry, ftpData).done(function () {
            
        });
        return true;
    }
    
    function toggleRemoteBrowserAvailability(enable) {
        if(enable){
            $("#bracketftp-status").text("browse remote directory");
            $("#bracketftp-status").attr("data-enabled", true);
        }else{
            $("#bracketftp-status").text("no remote server set");
            $("#bracketftp-status").attr("data-enabled", false);
        }
    }
    
    function readGlobalRemoteSettings() {
        defaultSettingsPath = normalizePath(defaultSettingsPath);
        var fileEntry = new FileSystem.FileEntry(defaultSettingsPath + "/" + settingsFilename);
        if (fileEntry) {
            var readSettingsPromise = FileUtils.readAsText(fileEntry);
        
            readSettingsPromise.done(function (result) {
                //remotesettings file does exist, read in JSON into object                
                if (result) {
                    toggleRemoteBrowserAvailability(true);
                    globalFtpDetails = $.parseJSON(result);
                    if(globalFtpDetails.protocol === "sftp"){
                        toggleRemoteBrowserAvailability(false);    
                    }else{
                        toggleRemoteBrowserAvailability(true);    
                    }                        
                }
            });
            readSettingsPromise.fail(function (err) {
                saveGlobalRemoteSettings();
            });
        }
    }
    readGlobalRemoteSettings();
    
    function showSettings(e) {
        Dialogs.showModalDialogUsingTemplate(BracketsFTPSettings, true).done(function (id) {
        });
        getSettings();
    }
    
    function eqFTPCheckField(id) {
        var t = $(id);
        var tmp = t.val();
        tmp = $.trim(tmp);
        t.removeClass('eqFTP-error');
        if(tmp=="") {
            t.addClass('eqFTP-error');
            triggerError({state:true, text: 'Oh! Looks like something gone wrong. Check input fields and try again.'});
            return false;
        }
        return true;
    }
    
    var uniqueTreeVar = 0;
    function renderFtpTree(params) {
        var fileList = params.ftpFileList;
        var l = parseInt(params.level);
        var needToBeOpen = params.needToBeOpen;
        if(isNaN(l)) { l = 0; }
        var lpx = l * 10;
        var html = "";
        $.each(fileList,function() {
            var add = "";
            var v = this;
            var path = params.path+"/"+v.name;
            if(v.children!=undefined && v.children.length>0) {
                add = '<ul class="eqFTPFileTreeHolder">'+renderFtpTree({ftpFileList:v.children,level:l+1,path:path})+'</ul>';
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
                        '<div class="eqFTPFileTreeCell bracketsftp-'+v.type+' eqFTPTableNamecol" data-path="'+path+'" style="padding-left:'+lpx+'px; width:'+w+'px"><span class="eqFTPFileTreePlusMinus"></span><span title="'+v.name+'">'+v.name+'</span></div>'+
                        '<div class="eqFTPFileTreeCell eqFTPTableSizecol" style="text-align:right;"><span title="'+v.size+'">'+v.sizeShort+'</span></div>'+
                        '<div class="eqFTPFileTreeCell eqFTPTableTypecol" style="text-align:right;"><span title="'+v.type+'">'+v.type+'</span></div>'+
                        '<div class="eqFTPFileTreeCell eqFTPTableLUcol" style="text-align:right;"><span title="'+v.lastupdated+'">'+v.lastupdatedShort+'</span></div>'+
                        add+'</li>';
            uniqueTreeVar++;
        });
        return html;
    }    
    
    function eqFTPRedrawFileTree() {
        var html = renderFtpTree({ftpFileList: remoteStructure[connectedServer],path:"/"});
        var target = $(fileBrowserResults).find("#eqFTPTable");
        target.empty().append(html);
    }
    
    function eqFTPShowRemoteModal(e) {
        if($('#detachedModal').length<1) {
            $('body').append('<div id="detachedModalHolder"><div id="detachedModal"></div></div>');
            $('body').on('click',"#detachedModalHolder",function(e) {
                var t = e.target;
                var p = $(t).parents('#bracketsftp-project-dialog');
                if(p.length!=1) {
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
        $('#detachedModal').html(BracketsFTPRemoteModal);
        $('#detachedModalHolder').show();
        $('#detachedModalHolder>#detachedModal>.modal').css('width',width);
        $('#eqFTPDirectoryListing').css('min-height',400);
        
        if(ftpLoaded==1) {
            $('#eqFTP-serverChoosing').show();
            $('#eqFTPLoading').hide();
        }
        
        eqFTPRedrawRemoteModalServerList();
        eqFTPRedrawFileTree();
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
        }else{
            if($.isArray(object.children)) {
               object = object.children;
            }
            $.each(object, function() {
                var object = this;
                if(object.type == "folder" && object.name == names[level]) {
                    level++;
                    object = recursiveSearch({level:level,object:object,names:names,addFolder:addFolder,state:state});
                    return false;
                }
            });
        }
        return object;
    }
    
    function openMainSettings() {
        $('*[data-eqFTP-openSettings]').removeClass('clicked');
        $('*[data-eqFTP-addConnection]').removeClass('clicked');
        $('#eqFTPGlobalSettings').addClass('clicked');
        $('#eqFTPSettingsHolder').hide();
        $('#eqFTPGlobalSettingsHolder').show();
        $("#eqFTP-connectionID").val('no');
    }
    
    /*
    *
    *
    ########## FTP ###########
    *
    *
    */
    
    function changeDirectory(params) {
        if(isNaN(parseInt(connectedServer))) {
            return false;
        }
        var ftp = globalFtpDetails.ftp[connectedServer];
        var shortPath = params.path;
        var newPath = shortPath;
        if(ftp.remotepath!="" && ftp.remotepath!=undefined) {
            newPath = ftp.remotepath + newPath;
        }
        console.log("[brackets-ftp] Changing directory...");    
        $("#bracketsftp-filebrowser .table-container").toggleClass("loading");
        $("#bracketsftp-filebrowser .table-container table").fadeOut(100);
        if (newPath === undefined || newPath === "") {
            currentRemoteDirectory = ftp.remotepath;                 
        } else {
            if (newPath === "..") {
                var pathArray = currentRemoteDirectory.split("/");                
                pathArray.pop();                
                currentRemoteDirectory = "";
                $.each(pathArray, function (index, value) {
                    if (value !== "") {
                        currentRemoteDirectory = currentRemoteDirectory + "/" + value;
                    }
                });                
            } else {
                //currentRemoteDirectory = currentRemoteDirectory + "/" + newPath;    
            }
        }
        
        currentRemoteDirectory = newPath;
        
        if(currentRemoteDirectory === "") {
            currentRemoteDirectory = "/";   
        }
        
        currentRemoteDirectory = normalizePath(currentRemoteDirectory);
        var t = $('div[data-path="'+shortPath+'"]').parent();
        var ul = $(t).children('ul:first');
        if(currentRemoteDirectory=="/") {
            var tmpCurrentDirectoryArray = [];
        }else{
            var tmpCurrentDirectoryArray = currentRemoteDirectory.split('/');
            tmpCurrentDirectoryArray.splice(0,1);
        }
        if(t.hasClass('opened')) {
            remoteStructure[connectedServer] = recursiveSearch({level:0,object:remoteStructure[connectedServer],names:tmpCurrentDirectoryArray,state:'closed'});
            t.removeClass('opened').addClass('closed');
            return true;
        }else if(ul.length>0){
            remoteStructure[connectedServer] = recursiveSearch({level:0,object:remoteStructure[connectedServer],names:tmpCurrentDirectoryArray,state:'opened'});
            t.addClass('opened').removeClass('closed');
            return true;
        }
        
        if (ftp.protocol === "sftp") {
            //var ftpPromise = nodeConnection.domains.bracketsftp.getDirectorySFTP(currentRemoteDirectory, ftp);
        } else {
            $('#eqFTPLoading').show();
            var ftpPromise = nodeConnection.domains.bracketsftp.getDirectory(currentRemoteDirectory, ftp);
        }
    }
    
    function uploadFile(localpath, remotepath, connectionID) {
        if(isNaN(parseInt(connectedServer))) {
            if(isNaN(parseInt(connectionID))) {
                return false;
            }
        }else{
            connectionID = connectedServer;
        }
        console.log("[brackets-ftp] Uploading file...");
        $("#toolbar-bracketsftp").addClass("uploading");
        
        if (globalFtpDetails.ftp[connectionID].protocol === "sftp") {
            /*
            var sftpPromise = nodeConnection.domains.bracketsftp.uploadFileSFTP(docPath, docName, projectFtpDetails, pathArray);
            sftpPromise.fail(function (err) {
                console.error("[brackets-ftp] Secure file upload failed for: " + docName, err);
                $("#toolbar-bracketsftp").toggleClass("working");
                $("#toolbar-bracketsftp").toggleClass("error");
                $("#toolbar-bracketsftp").delay(2000).toggleClass("error");
            });
            */
        } else {
            remotepath = normalizePath(remotepath);
            localpath = normalizePath(localpath);
            var ftpPromise = nodeConnection.domains.bracketsftp.uploadFile(localpath, remotepath, globalFtpDetails.ftp[connectionID]);
            ftpPromise.fail(function (err) {
                console.error("[brackets-ftp] File upload failed for: " + localpath, err);
            });
            ftpPromise.done(function() {
                $('#toolbar-bracketsftp').removeClass('uploading');
            });
        }
    }
    
    function uploadContextFile() {
        var fileEntry = ProjectManager.getSelectedItem();
        if (fileEntry.isDirectory) {
            alert("Cannot upload whole directories");
        } else {
            //uploadFile(fileEntry);
        }
    }
    
    function changeOpenedFiles(params) {
        if(params.action=="add") {
            params.path = normalizePath(params.path);
            var wait = setInterval(function() {
                var currentDocument = DocumentManager.getCurrentDocument();
                var cDID = currentDocument.file._id;
                currentDownloadedDocuments[cDID] = {doc:currentDocument,path:params.path,connectionID:connectedServer};
                clearInterval(wait);
            },1000);
        }else if(params.action=="delete") {
            if(typeof currentDownloadedDocuments[params.id] === "object" && currentDownloadedDocuments[params.id]!="undefined") {
                currentDownloadedDocuments.splice(params.id,1);
            }
        }
    }
    
    function tryOpenFile(path,i) {
        if(i==undefined) { i=0; }
        i++;
        var openPromise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: path});
        openPromise.done(changeOpenedFiles({action:"add",path:path}));
        openPromise.always(function() {
            $('#toolbar-bracketsftp').removeClass('downloading');
        });
        openPromise.fail(function() {
            if(i>3) {
                tryOpenFile(path,i)
            }
        });
    }
    
    function getFile(params) {
        if(isNaN(parseInt(connectedServer))) {
            return false;
        }
        $('#toolbar-bracketsftp').addClass('downloading');
        var ftp = globalFtpDetails.ftp[connectedServer];
        var path = globalFtpDetails.ftp[connectedServer].remotepath + params.path;
        var pathArray = path.split("/");
        var fileName = pathArray.pop();
        if(ftp.localpath=="") {
            var root = globalFtpDetails.main.folderToProjects + "/" + ftp.connectionName;
        }else{
            var root = ftp.localpath;
        }
        root = normalizePath(root);
        path = normalizePath(path);
        var localPath = root + "/" + pathArray.join("/") + "/";
        localPath = normalizePath(localPath);
        var ftpPromise = nodeConnection.domains.bracketsftp.getFile(path, localPath, fileName, ftp);
        ftpPromise.fail(function (err) {
            console.error(err);
        });
        ftpPromise.done(function() {
            changeeqFTPProjectNote({path:root,action:"write",data:{eqFTPid:connectedServer}});
            var wait = setInterval(function() {
                if(globalFtpDetails.main.noProjectOnDownload==false) {
                    var currentProjectRoot = ProjectManager.getProjectRoot();
                    if(currentProjectRoot._path==root+"/") {
                        tryOpenFile(localPath+fileName);
                    }else{
                        var openFolderPromise = ProjectManager.openProject(root);
                        openFolderPromise.done(function() {
                            tryOpenFile(localPath+fileName);
                        });
                        openFolderPromise.fail(function() {
                        });
                    }
                }else{
                    tryOpenFile(localPath+fileName);
                }
                clearInterval(wait);
            },1000);
        });
    }
    
    /*
    *
    *
    ######################## Events ###############################
    *
    *
    */
    
    $('body').on('click','#bracketsftp-openSettingsWindow',function() {
        showSettings();
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
                openMainSettings();
                return false;
            }
            var setting = globalFtpDetails.ftp[id];
            
            $('#eqFTP-connectionName').val(setting.connectionName);
            $("#eqFTP-connectionID").val(id);
            $("#eqFTP-server").val(setting.server);
            $("#eqFTP-serverport").val(setting.port);
            $("#eqFTP-username").val(setting.username);
            $("#eqFTP-password").val(setting.password);
            $("#eqFTP-remoteroot").val(setting.remotepath);
            $('#eqFTP-remotelocal').val(setting.localpath);
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
            var setting = globalFtpDetails.ftp[id];

            $('#eqFTP-connectionName').val('');
            $("#eqFTP-connectionID").val(id);
            $("#eqFTP-server").val('');
            $("#eqFTP-serverport").val('21');
            $("#eqFTP-username").val('');
            $("#eqFTP-password").val('');
            $("#eqFTP-remoteroot").val('');
            $('#eqFTP-remotelocal').val('');
            $("#eqFTP-connectToServerEvenIfDisconnected").prop('checked',false);
            $("#eqFTP-protocol option").prop('selected', false);
            $("#eqFTP-protocol option[value=FTP]").prop('selected', true);
            $("#eqFTP-uploadonsave").prop("checked", false);
        }
    });
    
    $('body').on('click','#eqFTPGlobalSettings',function() {
        openMainSettings();
    });
    
    $('body').on('change','#eqFTP-serverChoosing',function() {
        var id = parseInt($(this).val());
        if(isNaN(id)) { id = null; }
        connectedServer = id;
        var defaultLocalRoot = globalFtpDetails.main.folderToProjects;
        currentLocalRoot = defaultLocalRoot;
        if(globalFtpDetails.ftp[id].localpath!="") {
            currentLocalRoot = globalFtpDetails.ftp[id].localpath;
        }
        changeDirectory({path:""});
        $('#eqFTPConnectionControl').addClass('on');
    });
    
    $('body').on('click','.eqFTPFileTreeCell',function() {
        $('.eqFTPFileTreeCell').removeClass('clicked');
        $(this).parent().find('>div').addClass('clicked');
    });
    
    $('body').on('click','#eqFTPConnectionControl',function() {
        if(!isNaN(parseInt(connectedServer))) {
            connectedServer = null;
            $(this).removeClass('on');
            $('#eqFTPTable').html('');
        }else{
            var id = parseInt($('#eqFTP-serverChoosing').val());
            if(isNaN(id)) {
                connectedServer = null;
            }else{
                connectedServer = id;
                $(this).addClass('on');
                eqFTPRedrawFileTree();
            }
        }
    });
    
    $('body').on('click','.eqFTP-icon-close',function() {
        var id = parseInt($(this).parent().attr('data-eqFTP-openSettings'));
        if(!isNaN(id)) {
            var r=confirm("Please confirm deletion of \""+globalFtpDetails.ftp[id].connectionName+"\" connection.");
            if (r==true) {
                globalFtpDetails.ftp.splice(id,1);
                saveGlobalRemoteSettings();
                triggerNotification({state:true,text:"Everything's saved! :)"});
                getSettings();
                openMainSettings();
            }
        }
    });
    
    $('body').on('click','#eqFTPButtonApply',function() {
        triggerNotification({state:false});
        triggerError({state:false});
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
                
                var tmp_localroot = $("#eqFTP-remotelocal").val();
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
                globalFtpDetails.ftp[tmp_connectionID] = tmp;
            }
        }
        
        if($('#eqFTP-SettingsFolder').val()!="") {
            prefs.set('defaultSettingsPath',$('#eqFTP-SettingsFolder').val());
        }else{
            prefs.set('defaultSettingsPath',ExtensionUtils.getModulePath(module));
        }
        prefs.save();
        
        globalFtpDetails.main.folderToProjects = $("#eqFTP-ProjectsFolder").val();
        globalFtpDetails.main.noProjectOnDownload = false;
        if($("#eqFTP-noProjectOnDownload").is(':checked')) {
            globalFtpDetails.main.noProjectOnDownload = true;
        }
        
        var tmp = saveGlobalRemoteSettings();
        if(tmp==true) {
            triggerNotification({state:true,text:"Everything's saved! :)"});
            getSettings();
            eqFTPRedrawRemoteModalServerList();
        }else{
            triggerError({state:true,text:"Something gone totally wrong! I can't write settings to file!"});
        }
    });
    
    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/eqFTP-styles.css");
        
        //********************************
        //****** Set Up UI Elements ******
        //********************************
        
        $("#main-toolbar .buttons").append(BracketsFTPToolbar);
        
        var eqFTP_UPLOADCONTEXTFILE_ID = "bracketsftp.uploadcontextfile";
        CommandManager.register("Upload File", eqFTP_UPLOADCONTEXTFILE_ID, uploadContextFile);
        
        $("#toolbar-bracketsftp").on('click', function (e) {
            // showSettingsDialog();
            eqFTPShowRemoteModal(e);
        });      
        
        $("#bracketftp-status").click(function () {
            if($(this).attr('data-enabled')){
                toggleFTPFileBrowser();
            }
        });
        
        $("body").on('dblclick', ".bracketsftp-folder", function () {            
             changeDirectory({path:$(this).attr("data-path")});
        });
        
        $("body").on('click', ".eqFTPFileTreePlusMinus", function () {            
             changeDirectory({path:$(this).parent().attr("data-path")});
        });
        
        $("body").on('dblclick', ".bracketsftp-file", function () {            
             getFile({path:$(this).attr("data-path")});
        });
        
    });
    
    AppInit.appReady(function () {
        console.log("Brackets FTP Loaded");
        
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
                console.log(err);
                ftpLoaded = 0;
                $('#eqFTPLoading').hide().after('<span>Loading failed :(</span>');
            });
            loadPromise.done(function (done) {
                ftpLoaded = 1;
                $('#eqFTP-serverChoosing').show();
                $('#eqFTPLoading').hide(); 
            });
            return loadPromise;
        }
        
        chain(connectNode, loadNodeFtp);
        
        $(nodeConnection).on("bracketsftp.getDirectorySFTP", function (event, result) {
            console.log(result);
        });
        
        $(nodeConnection).on("bracketsftp.getDirectory", function (event, result) {
            var files = JSON.parse(result);
            var sanitizedFolders = new Array();
            var sanitizedFiles = new Array();
            
            //Get all files
            $.each(files, function (index, value) {
                if (value !== null) {
                    if (value.type === 0) {
                        var date = convertDate({input:value.time,type:'full'});
                        var dateShort = convertDate({input:value.time,type:'short'});
                        var sizeShort = shortenFilesize({input:value.size,type:'short'});
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
                        var date = convertDate({input:value.time,type:'full'});
                        var dateShort = convertDate({input:value.time,type:'short'});
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
            
            if(remoteStructure[connectedServer]==undefined) {
                remoteStructure[connectedServer] = [];
            }
            var thisFolderStructure = sanitizedFolders.concat(sanitizedFiles);
            if(currentRemoteDirectory=="/") {
                var tmpCurrentDirectoryArray = [];
            }else{
                currentRemoteDirectory = normalizePath(currentRemoteDirectory);
                var tmpCurrentDirectoryArray = currentRemoteDirectory.split('/');
                tmpCurrentDirectoryArray.splice(0,1);
            }
            remoteStructure[connectedServer] = recursiveSearch({level:0,object:remoteStructure[connectedServer],names:tmpCurrentDirectoryArray,addFolder:thisFolderStructure,state:'opened'});
            
            //var html = Mustache.render(FileBrowserTemplate, {ftpFileList: remoteStructure[connectedServer]});
            eqFTPRedrawFileTree();
            $('#eqFTPLoading').hide();        
        });
        
        $(nodeConnection).on("bracketsftp.getFileResult", function (event, param) {
            if (param.status === "complete") {
            }
        });
        
        $(nodeConnection).on("bracketsftp.uploadResult", function (event, param) {
            var toolbarResetTimeout;
            
            if (param === "complete") {
                console.log("[brackets-ftp] Upload complete", param);
                $("#toolbar-bracketsftp").addClass("complete");
                toolbarResetTimeout = window.setTimeout(function () {
                    $("#toolbar-bracketsftp").removeClass("complete");
                    window.clearTimeout(toolbarResetTimeout);
                }, 2000);
            }
            
            if (param === "uploaderror") {
                console.error("[brackets-ftp] Upload failed");
                $("#toolbar-bracketsftp").addClass("error");
                toolbarResetTimeout = window.setTimeout(function () {
                    $("#toolbar-bracketsftp").removeClass("error");
                    window.clearTimeout(toolbarResetTimeout);
                }, 2000);
            }
            
            if (param === "autherror") {
                console.error("[brackets-ftp] FTP authetication failed");
                $("#toolbar-bracketsftp").addClass("error");
                toolbarResetTimeout = window.setTimeout(function () {
                    $("#toolbar-bracketsftp").removeClass("error");
                    window.clearTimeout(toolbarResetTimeout);
                }, 2000);
            }
        });
        
    });
    
    $(DocumentManager).on("beforeDocumentDelete", function(event, doc) {
        var delId = doc.file._id;
        changeOpenedFiles({action:"delete",id:delId});
    });
    
    $(DocumentManager).on("documentSaved", function (event, doc) {
        var fileid = doc.file._id;
        var document = DocumentManager.getCurrentDocument();
        if(ProjectManager.isWithinProject(document.file.fullPath)) {
            var projectRoot = ProjectManager.getProjectRoot();
            var promise = changeeqFTPProjectNote({path:projectRoot._path,action:"read"});
            promise.done(function(result) {
                var r = $.parseJSON(result);
                var connectionID = r.eqFTPid;
                
                var docPath = document.file.fullPath;
                var docName = document.file.name;
                var pathArray = ProjectManager.makeProjectRelativeIfPossible(docPath).split("/");
                var i = 0;
                var pathArrayString = globalFtpDetails.ftp[connectionID].remotepath;
                for (i; i < (pathArray.length - 1); i++) {
                    pathArrayString = pathArrayString + "/" + pathArray[i];
                }
                var remotepath = pathArrayString + "/" + docName;
                
                if (globalFtpDetails.ftp[connectionID].uploadOnSave === true && globalFtpDetails.ftp[connectionID].server !== "") {
                    if(globalFtpDetails.ftp[connectionID].connectToServerEvenIfDisconnected==true) {
                        uploadFile(document.file.fullPath,remotepath,connectionID);
                    }else if(connectionID==connectedServer) {
                        uploadFile(document.file.fullPath,remotepath,connectionID);
                    }
                }
            });
        }else if(typeof currentDownloadedDocuments[fileid] === "object" && currentDownloadedDocuments[fileid]!="undefined") {
            var remotepath = currentDownloadedDocuments[fileid].path;
            var connectionID = currentDownloadedDocuments[fileid].connectionID;
            uploadFile(document.file.fullPath,remotepath,connectionID);
        }
    });    
});