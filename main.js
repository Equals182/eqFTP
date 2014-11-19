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
 * version 0.6.2
 * - Updated Once module and added SCP2 module for SFTP support.
 * - Redesigned ftpDomain.js's structure for SFTP support.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50  */
/*global define, brackets, Mustache, $*/


define(function (require, exports, module) {
    "use strict";
    
    var nodeConnection,
        CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        Commands = brackets.getModule("command/Commands"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        StatusBar = brackets.getModule("widgets/StatusBar"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
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
        eqFTPQueueTemplate = require("text!htmlContent/eqFTP-queue.html"),
        
        eqFTP = {},
        tmp_modalClickedItem,
        currentQueueTask,
        queuePanel = false,
        defaultUsersDir = brackets.app.getUserDocumentsDirectory(),
        defaultProjectsDir = defaultUsersDir + "/eqFTP Projects",
        allowDMHide = true,
        DMw = 300,
        DMh = 600,
		JColResizer = {},
        eqftpVersion = "0.6.3";
    
    eqFTPSettingsTemplate = Mustache.render(eqFTPSettingsTemplate, eqFTPstrings);
    eqFTPPasswordTemplate = Mustache.render(eqFTPPasswordTemplate, eqFTPstrings);
    eqFTPModalTemplate = Mustache.render(eqFTPModalTemplate, eqFTPstrings);
    eqFTPToolbarTemplate = Mustache.render(eqFTPToolbarTemplate, eqFTPstrings);
    eqFTPQueueTemplate = Mustache.render(eqFTPQueueTemplate, eqFTPstrings);
    FileSystem.getDirectoryForPath(defaultProjectsDir).create();
    
    eqFTP.globals = {
        globalFtpDetails: {'main': {folderToProjects: defaultProjectsDir, debug: false}, 'ftp': []},
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
        projectsPaths: [],
        lastQueueTab: null,
		lastQueueKeys: [],
		queueTableParams: {
			widths: {
				Name: "25%",
				From: "25%",
				To: "25%",
				Status: "25%"
			}
		},
        clickedTreeElement: 0
    };
    
    eqFTP.globals.prefs.definePreference("defaultSettingsPathPref", "string", eqFTP.globals.defaultSettingsPath);
    eqFTP.globals.prefs.definePreference("projectsPaths", "string", []);
    eqFTP.globals.prefs.definePreference("useEncryption", "string", "false");
    var tmp_defaultSettingsPath = eqFTP.globals.prefs.get("defaultSettingsPath");
    if (tmp_defaultSettingsPath !== undefined && tmp_defaultSettingsPath !== "") {
        eqFTP.globals.defaultSettingsPath = tmp_defaultSettingsPath;
    }
    
    eqFTP.globals.prefs.on("change", function () {
        eqFTP.globals.defaultSettingsPath = eqFTP.globals.prefs.get("defaultSettingsPathPref");
        eqFTP.globals.useEncryption = eqFTP.globals.prefs.get("useEncryption");
        eqFTP.globals.projectsPaths = eqFTP.globals.prefs.get("projectsPaths");
        if (eqFTP.globals.useEncryption === true && eqFTP.globals.masterPassword === null) {
            //masterPassword = callPasswordDialog();
        }
    });
    
    /**
    ######################## Global functions ###############################
    */
	
	/*
	========== jQuery Table Plugin ==========
	*/
JColResizer.vars = {
	drag: null,
	tables: [],
	count: 0,
	ID: "id",
	PX: "px",
	SIGNATURE: "JColResizer",
	S: []
}

JColResizer.init=function(a,b){var c=$(a);if(b.disable)return JColResizer.destroy(c);var d=c.id=c.attr(JColResizer.vars.ID)||JColResizer.vars.SIGNATURE+JColResizer.vars.count++;c.p=b.postbackSafe;c.is("table")&&!JColResizer.vars.tables[d]&&(c.addClass(JColResizer.vars.SIGNATURE).attr(JColResizer.vars.ID,d).before('<div class="JCLRgrips"/>'),c.opt=b,c.g=[],c.c=[],c.w=c.width(),c.gc=c.prev(),b.marginLeft&&c.gc.css("marginLeft",b.marginLeft),b.marginRight&&c.gc.css("marginRight",b.marginRight),c.cs=
parseInt(JColResizer.vars.ie?a.cellSpacing||a.currentStyle.borderSpacing:c.css("border-spacing"))||2,c.b=parseInt(JColResizer.vars.ie?a.border||a.currentStyle.borderLeftWidth:c.css("border-left-width"))||1,JColResizer.vars.tables[d]=c,JColResizer.createGrips(c))};JColResizer.destroy=function(a){var b=a.attr(JColResizer.vars.ID);(a=JColResizer.vars.tables[b])&&a.is("table")&&(a.removeClass(JColResizer.vars.SIGNATURE).gc.remove(),delete JColResizer.vars.tables[b])};
JColResizer.createGrips=function(a){var b=a.find(">thead>tr>th,>thead>tr>td");b.length||(b=a.find(">tbody>tr:first>th,>tr:first>th,>tbody>tr:first>td, >tr:first>td"));a.cg=a.find("col");a.ln=b.length;a.p&&S&&S[a.id]&&JColResizer.memento(a,b);b.each(function(b){var d=$(this),e=$(a.gc.append('<div class="JCLRgrip"></div>')[0].lastChild);e.t=a;e.i=b;e.c=d;d.w=d.width();a.g.push(e);a.c.push(d);d.width(d.w).removeAttr("width");b<a.ln-1?e.mousedown(JColResizer.onGripMouseDown).append(a.opt.gripInnerHtml).append('<div class="'+
JColResizer.vars.SIGNATURE+'" style="cursor:'+a.opt.hoverCursor+'"></div>'):e.addClass("JCLRLastGrip").removeClass("JCLRgrip");e.data(JColResizer.vars.SIGNATURE,{i:b,t:a.attr(JColResizer.vars.ID)})});a.cg.removeAttr("width");JColResizer.syncGrips(a);a.find("td, th").not(b).not("table th, table td").each(function(){$(this).removeAttr("width")})};
JColResizer.memento=function(a,b){var c,d=0,e=0,f=[];if(b)if(a.cg.removeAttr("width"),a.opt.flush)S[a.id]="";else{for(c=JColResizer.vars.S[a.id].split(";");e<a.ln;e++)f.push(100*c[e]/c[a.ln]+"%"),b.eq(e).css("width",f[e]);for(e=0;e<a.ln;e++)a.cg.eq(e).css("width",f[e])}else{JColResizer.vars.S[a.id]="";for(e in a.c)c=a.c[e].width(),JColResizer.vars.S[a.id]+=c+";",d+=c;JColResizer.vars.S[a.id]+=d}};
JColResizer.syncGrips=function(a){a.gc.width(a.w);for(var b=0;b<a.ln;b++){var c=a.c[b];a.g[b].css({left:c.offset().left-a.offset().left+c.outerWidth()+a.cs/2+JColResizer.vars.PX,height:a.opt.headerOnly?a.c[0].outerHeight():a.outerHeight()})}};
JColResizer.syncCols=function(a,b,c){var d=JColResizer.vars.drag.x-JColResizer.vars.drag.l,e=a.c[b],f=a.c[b+1],g=e.w+d,d=f.w-d;e.width(g+JColResizer.vars.PX);f.width(d+JColResizer.vars.PX);a.cg.eq(b).width(g+JColResizer.vars.PX);a.cg.eq(b+1).width(d+JColResizer.vars.PX);c&&(e.w=g,f.w=d)};
JColResizer.onGripDrag=function(a){if(JColResizer.vars.drag){var b=JColResizer.vars.drag.t,c=a.pageX-JColResizer.vars.drag.ox+JColResizer.vars.drag.l,d=b.opt.minWidth,e=JColResizer.vars.drag.i,f=1.5*b.cs+d+b.b,g=e==b.ln-1?b.w-f:b.g[e+1].position().left-b.cs-d,d=e?b.g[e-1].position().left+b.cs+d:f,c=Math.max(d,Math.min(g,c));JColResizer.vars.drag.x=c;JColResizer.vars.drag.css("left",c+JColResizer.vars.PX);b.opt.liveDrag&&(JColResizer.syncCols(b,e),JColResizer.syncGrips(b),c=b.opt.onDrag)&&(a.currentTarget=
b[0],c(a));return!1}};
var onGripDragOver=function(a){$("body").off("mousemove."+JColResizer.vars.SIGNATURE).off("mouseup."+JColResizer.vars.SIGNATURE);$("head :last-child").remove();if(JColResizer.vars.drag){JColResizer.vars.drag.removeClass(JColResizer.vars.drag.t.opt.draggingClass);var b=JColResizer.vars.drag.t,c=b.opt.onResize;JColResizer.vars.drag.x&&(JColResizer.syncCols(b,JColResizer.vars.drag.i,!0),JColResizer.syncGrips(b),c&&(a.currentTarget=b[0],c(a)));b.p&&JColResizer.vars.S&&JColResizer.memento(b);JColResizer.vars.drag=
null}};JColResizer.onGripMouseDown=function(a){var b=$(this).data(JColResizer.vars.SIGNATURE),c=JColResizer.vars.tables[b.t],d=c.g[b.i];d.ox=a.pageX;d.l=d.position().left;$("body").on("mousemove."+JColResizer.vars.SIGNATURE,JColResizer.onGripDrag).on("mouseup."+JColResizer.vars.SIGNATURE,onGripDragOver);d.addClass(c.opt.draggingClass);JColResizer.vars.drag=d;if(c.c[b.i].l)for(a=0;a<c.ln;a++)b=c.c[a],b.l=!1,b.w=b.width();return!1};
JColResizer.onResize=function(){for(a in JColResizer.vars.tables){var a=JColResizer.vars.tables[a],b,c=0;a.removeClass(JColResizer.vars.SIGNATURE);if(a.w!=a.width()){a.w=a.width();for(b=0;b<a.ln;b++)c+=a.c[b].w;for(b=0;b<a.ln;b++)a.c[b].css("width",Math.round(1E3*a.c[b].w/c)/10+"%").l=!0}JColResizer.syncGrips(a.addClass(JColResizer.vars.SIGNATURE))}};$("body").on("resize."+JColResizer.vars.SIGNATURE,JColResizer.onResize);
JColResizer.colResizable=function(a,b){b=$.extend({draggingClass:"JCLRgripDrag",gripInnerHtml:"",liveDrag:!1,minWidth:15,headerOnly:!1,hoverCursor:"e-resize",dragCursor:"e-resize",postbackSafe:!1,flush:!1,marginLeft:null,marginRight:null,disable:!1,onDrag:null,onResize:null},b);return a.each(function(){JColResizer.init(this,b)})};

	/*
	========== jQuery Table Plugin ==========
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
            var firstFunction = functions.shift(),
                firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }
        
    function eqFTPCheckField(id) {
        var t = $(id),
            tmp = t.val();
        tmp = $.trim(tmp);
        t.removeClass('eqFTP-error');
        if (tmp === "") {
            t.addClass('eqFTP-error');
            eqFTP.serviceFunctions.triggerSettingsNotification({type: 'error', state: true, text: eqFTPstrings.SETTINGSWIND_ERR_BLANKS});
            return false;
        }
        return true;
    }
    
    function recursiveSearch(params) {
        var stack = [];
        var searchIn = params.searchIn;
        $.each(searchIn, function () {
            if (this.type === "folder" && this.state === params.state) {
                if (params.name === undefined) {
                    params.name = "";
                }
                stack.push(params.name + "/" + this.name);
                if (this.children !== undefined && this.children.length > 0) {
                    stack = stack.concat(recursiveSearch({
                        name: params.name + "/" + this.name,
                        searchIn: this.children,
                        state: params.state,
                        callback: params.callback
                    }));
                }
            }
        });
        return stack;
    }
    
    var recDirInt = null;
    var filesArray = [];
    function getLocalDirectoryRecursive(dir, callback) {
        if (!dir._contents) {
            FileSystem.getDirectoryForPath(dir._path).getContents(function () {
                getLocalDirectoryRecursive(dir, callback);
            });
        }
        if (dir._contents) {
            $.each(dir._contents, function () {
                if (this._isDirectory) {
                    getLocalDirectoryRecursive(this, callback);
                    //filesArray = filesArray.concat(getLocalDirectoryRecursive(this, callback));
                } else if (this._isFile) {
                    filesArray.push(this);
                }
            });
        }
        if (recDirInt !== null) {
            clearInterval(recDirInt);
            recDirInt = null;
        }
        recDirInt = setInterval(function () {
            if (isFunction(callback)) {
                callback(filesArray);
            }
            clearInterval(recDirInt);
            recDirInt = null;
        }, 1000);
        return filesArray;
    }
    
    eqFTP.serviceFunctions = {
        ftpLoaded: function (e) {
            if (e) {
                $('#eqFTP-serverChoosing').show();
                $('#eqFTP-openSettingsWindow').show();
                $('#eqFTPLoading').hide();
                $('#eqFTPLoadingFailed').remove();
                $('#toolbar-eqFTP').removeClass('disabled');
                $("#eqFTPQueueIndicator").removeClass('disabled');
            } else {
                $('#eqFTP-serverChoosing').hide();
                $('#eqFTP-openSettingsWindow').hide();
                $('#eqFTPLoading').show();
                $('#eqFTPLoading').hide().after('<span id="eqFTPLoadingFailed">' + eqFTPstrings.ERR_LOADING + '</span>');
                $('#toolbar-eqFTP').addClass('disabled');
                $("#eqFTPQueueIndicator").addClass('disabled');
            }
            eqFTP.serviceFunctions.redrawRemoteModalServerList();
            eqFTP.serviceFunctions.redrawFileTree();
            eqFTP.globals.ftpLoaded = e;
        },
        normalizePath: function (input) {
            if (input !== undefined) {
                var tmp = input.replace(/\\+/g, '/');
                tmp = tmp.replace(/\/\/+/g, '/');
                return tmp;
            }
            return undefined;
        },
        escapeSymbol: function (input) {
            if (input) {
                input = input.toString();
                return input.replace("'", "&#39;");
            } else {
                return input;
            }
        },
        generateUniqueId: function (params) {
            if (!params.salt) {
                params.salt = "";
            }
            var d = new Date(),
                t = d.getTime(),
                r = "f_" + t + params.salt;
            return r;
        },
        redrawRemoteModalServerList: function () {
            $('#eqFTP-serverChoosing').html('');
            $('#eqFTP-serverChoosing').append('<option disabled selected value="">' + eqFTPstrings.OTHER_SELECT_SERVER_DROPDOWN + '</option><option disabled>------------------------------</option>');
            var i = 0;
            if (eqFTP.globals.globalFtpDetails.ftp.length > 0) {
                $.each(eqFTP.globals.globalFtpDetails.ftp, function () {
                    var t = this;
                    $('#eqFTP-serverChoosing').append('<option value="' + i + '">' + t.connectionName + '</option>');
                    i++;
                });
            }
            var tmp_connectedServer = parseInt(eqFTP.globals.connectedServer);
            if (!isNaN(tmp_connectedServer)) {
                $('#eqFTP-serverChoosing option').prop('selected', false);
                $('#eqFTP-serverChoosing option[value=' + tmp_connectedServer + ']').prop('selected', true);
            }
        },
        redrawFileTree: function () {
            var target = $(eqFTP.globals.fileBrowserResults).find("#eqFTPTable");
            uniqueTreeVar = 0;
            var html = eqFTP.serviceFunctions.renderFTPTree({ftpFileList: eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer], path: "/"});
            target.empty().append(html);
            $('#eqFTP-project-dialog>.modal-body').scrollTop(eqFTP.globals.scrllTop);
            if (eqFTP.globals.clickedTreeElement !== 0) {
                $('.eqFTPFileTreeCell').removeClass('clicked');
                $('li[data-bftControl="' + eqFTP.globals.clickedTreeElement + '"]:first').find('>div').addClass('clicked');
            }
        },
        renderFTPTree: function (params) {
            var fileList = params.ftpFileList,
                l = parseInt(params.level),
                needToBeOpen = params.needToBeOpen;
            if (isNaN(l)) { l = 0; }
            var lpx = l * 10,
                html = "";
            //console.log("[eqFTP] Rendering structure (level "+l+"): "+JSON.stringify(fileList));
            if (fileList !== undefined) {
                $.each(fileList, function () {
                    var add = "";
                    var v = this;
                    var path = params.path + "/" + v.name;
                    if (v.children !== undefined && v.children.length > 0) {
                        add = '<ul class="eqFTPFileTreeHolder">' + eqFTP.serviceFunctions.renderFTPTree({ftpFileList: v.children, level: l + 1, path: path}) + '</ul>';
                    }
                    var opened = "";
                    if (v.state !== undefined && v.state === 'opened') {
                        opened = "opened";
                    } else if (v.state === 'closed') {
                        opened = "closed";
                    }
                    var lp = l + 1,
                        w = 170 - lpx;
                    html = html + '<li class="eqFTPLevel' + lp + ' eqFTPFileTreeRow ' + opened + '" data-bftControl="' + uniqueTreeVar + '">' +
                                '<div class="eqFTPFileTreeCell eqFTP-' + v.type + ' eqFTPTableNamecol" data-path="' + path + '" style="padding-left:' + lpx + 'px;"><span class="eqFTPFileTreePlusMinus"></span><span title="' + v.name + '" class="eqFTPModalItemTitle">' + v.name + '</span></div>' +
                                '<div class="eqFTPFileTreeCell eqFTPTableSizecol" style="text-align:right;"><span title="' + v.size + '">' + v.sizeShort + '</span></div>' +
                                '<div class="eqFTPFileTreeCell eqFTPTableTypecol" style="text-align:right;"><span title="' + v.type + '">' + v.type + '</span></div>' +
                                '<div class="eqFTPFileTreeCell eqFTPTableLUcol" style="text-align:right;"><span title="' + eqFTP.serviceFunctions.convertDate({input: v.lastupdated, type: 'full'}) + '">' + eqFTP.serviceFunctions.convertDate({input: v.lastupdatedShort, type: 'short'}) + '</span></div>' +
                                add + '</li>';
                    uniqueTreeVar++;
                });
            }
            return html;
        },
        triggerSettingsNotification: function (params) {
            /*
            * @ params {object}:
            *   state: {boolean} | use it to turn notification on and off
            *   type: {string} ( 'notification' | 'error' ) | use one of these variants for different style
            *   text: {string} | this text will appear in alert
            *
            * I don't know how to write this docs. 2lazy2google.
            */
            var state = params.state;
            if (state == 0 || state === false) {
                $('#eqFTP-' + params.type + 'Message').addClass('hide');
                return true;
            } else {
                $('#eqFTP-' + params.type + 'Message').removeClass('hide');
            }
            var text = params.text;
            $('#eqFTP-' + params.type + 'Message').text(text);
        },
        convertDate: function (params) {
            var offset = parseInt(eqFTP.globals.globalFtpDetails.ftp[eqFTP.globals.connectedServer].timeOffset);
            if (isNaN(offset)) {
                offset = 0;
            }
            var fullDate = new Date(params.input + (offset * 60 * 60 * 1000) ),
                r = "",
                tf = eqFTP.globals.globalFtpDetails.main.timeFormat;
            if (params.type === 'full') {
                r = fullDate.toLocaleString("en-US");
                if (tf === 'EU') {
                    r = fullDate.toLocaleString("en-GB");
                } else if (tf === "ASIAN") {
                    r = fullDate.toLocaleString("ja-JP");
                }
            } else if (params.type === 'short') {
                var d = fullDate.getDate();
                if (d < 10) { d = "0" + d; }
                var m = fullDate.getMonth() + 1;
                if (m < 10) { m = "0" + m; }
                var Y = fullDate.getFullYear();
                
                r = m + "/" + d + "/" + Y;
                if (tf === 'EU') {
                    r = d + "." + m + "." + Y;
                } else if (tf === "ASIAN") {
                    r = Y + "-" + m + "-" + d;
                }
            }
            return r;
        },
        shortenFilesize: function (params) {
            var bytes = parseInt(params.input),
                si = params.si;
            si = false;
            var thresh = si ? 1000 : 1024;
            if (bytes < thresh) { return bytes + ' B'; }
            var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'],
                u = -1;
            do {
                bytes /= thresh;
                ++u;
            } while (bytes >= thresh);
            return bytes.toFixed(1) + ' ' + units[u];
        },
        showSettingsWindow: function (params) {
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
            if (!isNaN(id)) {
                $('*[data-eqFTP-opensettings='+id+']').addClass('clicked');
            }
            $('#eqFTP-ProjectsFolder').val(eqFTP.globals.globalFtpDetails.main.folderToProjects);
            if (eqFTP.globals.globalFtpDetails.main.noProjectOnDownload === true) {
                $('#eqFTP-noProjectOnDownload').prop('checked', true);
            } else {
                $('#eqFTP-noProjectOnDownload').prop('checked', false);
            }
            $('#eqFTP-SettingsFolder').val(eqFTP.globals.defaultSettingsPath);
            if (eqFTP.globals.globalFtpDetails.main.debug === true) {
                $('#eqFTP-debug').prop('checked', true);
            } else {
                $('#eqFTP-debug').prop('checked', false);
            }
            if (eqFTP.globals.globalFtpDetails.main.autoClear === true) {
                $('#eqFTP-autoClear').prop('checked', true);
            } else {
                $('#eqFTP-autoClear').prop('checked', false);
            }
            if (eqFTP.globals.globalFtpDetails.main.notifications === true) {
                $('#eqFTP-notifications').prop('checked', true);
            } else {
                $('#eqFTP-notifications').prop('checked', false);
            }
            
            $("#eqFTP-timeFormat option[value=" + eqFTP.globals.globalFtpDetails.main.timeFormat + "]").prop('selected', true);
            $('#eqFTP-useEncryption').prop('checked', eqFTP.globals.useEncryption);
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
                    if (currentDocument) {
                        var cDID = currentDocument.file._id;
                        eqFTP.globals.currentDownloadedDocuments[cDID] = {doc:currentDocument,path:params.path,connectionID:eqFTP.globals.connectedServer};                        
                    }
                    clearInterval(wait);
                },1000);
            }else if(params.action=="delete") {
                if(typeof eqFTP.globals.currentDownloadedDocuments[params.id] === "object" && eqFTP.globals.currentDownloadedDocuments[params.id]!="undefined") {
                    eqFTP.globals.currentDownloadedDocuments.splice(params.id,1);
                }
            }
        },
        tryOpenFile: function (path, i) {
            if (eqFTP.globals.globalFtpDetails.main.debug)
                console.log('[eqFTP] Trying to open file: '+path);
            var waitASec = setInterval(function() {
                if(i==undefined) { i = 0; }
                i++;
                new FileSystem.resolve(path, function(err, item, stat) {
                    if (!err) {
                        if (stat._size !== 0) {
                            var openPromise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: path});
                            openPromise.done(function() {
                                eqFTP.serviceFunctions.updateOpenedFiles({action:"add",path:path})
                                i = 10;
                            });
                            openPromise.always(function() {
                            });
                            openPromise.fail(function(err) {
                                console.error('[eqFTP] Try #' + i + ': failed open file.');
                            });
                        }
                    }
                });
                if(i>1) {
                    clearInterval(waitASec);
                }
            },1000);
        },
        makeRemotePathFromLocal: function(params) {
            var pathArrayString = "";
            if (ProjectManager.isWithinProject(params.localPath)) {
                var pathArray = ProjectManager.makeProjectRelativeIfPossible(params.localPath).split("/"),
                    i = 0,
                    remoteRoot = eqFTP.globals.globalFtpDetails.ftp[params.connectionID].remotepath;
                pathArray.pop();
                pathArrayString = pathArray.join('/');
            }
            var result = {};
            result.remotePath = pathArrayString + "/" + params.name;
            result.remoteRoot = remoteRoot;
            return result;
        },
        redrawQueue: function() {
            var trs = [];
            $.each(eqFTP.globals.processQueue, function() {
                if (this !== undefined) {
                    if (this.direction === 'download') {
                        var from = this.remotePath;
                        var to = this.localPath + this.name;
                    } else if (this.direction === 'upload'){
                        var from = this.localPath;
                        var to = this.remotePath;
                    }
                    if (this.transferData) {
                        var d = this.transferData.transferred,
                            t = this.transferData.total,
                            status = Math.floor(d * 100 / t);
                        if (status > 100) { status = 100; }
                        var percent = status;
                        status += "%";
                    } else {
                        var status = eqFTPstrings.OTHER_WAITING;
                    }
                    if (!trs[this.connectionID]) {
                        trs[this.connectionID] = "";
                    }
                    trs[this.connectionID] +=  "<tr class='transferring' id='" + eqFTP.serviceFunctions.escapeSymbol(this.id) + "'>" +
                                "<td class='name' width='10%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(this.name) + "'><span data-eqFTPQueueRemove='processQueue' title='" + eqFTP.serviceFunctions.escapeSymbol(eqFTPstrings.QUEUE_REMOVE) + "'>&times;</span>" + this.name + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(from) + "'>" + from + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(to) + "'>" + to + "</span></td>" +
                                "<td class='status' width='30%'><span>" + status + "</span><div class='progessBar' style='width:" + eqFTP.serviceFunctions.escapeSymbol(percent) + "%;'></div></td>" +
                            "</tr>";
                }
            });
            $.each(eqFTP.globals.automaticQueue,function() {
                if(this!=undefined) {
                    if (this.direction === 'download') {
                        var from = this.remotePath;
                        var to = this.localPath + this.name;
                    } else if (this.direction === 'upload'){
                        var from = this.localPath;
                        var to = this.remotePath;
                    }
                    if(this.status === undefined) {
                        var status = eqFTPstrings.OTHER_WAITING;
                    }else if(this.status) {
                        var status = eqFTPstrings.OTHER_COMPLETED;
                    }else{
                        var status = eqFTPstrings.OTHER_ERROR;
                    }
                    if (!trs[this.connectionID]) {
                        trs[this.connectionID] = "";
                    }
                    trs[this.connectionID] +=  "<tr class='automatic' id='" + eqFTP.serviceFunctions.escapeSymbol(this.id) + "'>"+
                                "<td class='name' width='30%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(this.name) + "'><span data-eqFTPQueueRemove='automaticQueue' title='" + eqFTP.serviceFunctions.escapeSymbol(eqFTPstrings.QUEUE_REMOVE) + "'>&times;</span>" + this.name + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(from) + "'>" + from + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(to) + "'>" + to + "</span></td>" +
                                "<td class='status' width='30%'>" + status + "</td>"
                            "</tr>";
                }
            });
            $.each(eqFTP.globals.pausedQueue,function() {
                if(this!=undefined) {
                    if (this.direction === 'download') {
                        var from = this.remotePath;
                        var to = this.localPath + this.name;
                    } else if (this.direction === 'upload'){
                        var from = this.localPath;
                        var to = this.remotePath;
                    }
                    var status = eqFTPstrings.OTHER_PAUSED;
                    if (!trs[this.connectionID]) {
                        trs[this.connectionID] = "";
                    }
                    trs[this.connectionID] +=  "<tr class='paused' id='" + eqFTP.serviceFunctions.escapeSymbol(this.id) + "'>"+
                                "<td class='name' width='30%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(this.name) + "'><span data-eqFTPQueueRemove='pausedQueue' title='" + eqFTP.serviceFunctions.escapeSymbol(eqFTPstrings.QUEUE_REMOVE) + "'>&times;</span>" + this.name + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(from) + "'>" + from + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(to) + "'>" + to + "</span></td>" +
                                "<td class='status' width='30%'>" + status + "</td>"+
                            "</tr>";
                }
            });
            $.each(eqFTP.globals.failedQueue,function() {
                if(this!=undefined) {
                    if (this.direction === 'download') {
                        var from = this.remotePath;
                        var to = this.localPath + this.name;
                    } else if (this.direction === 'upload'){
                        var from = this.localPath;
                        var to = this.remotePath;
                    }
                    var status = eqFTPstrings.OTHER_ERROR;
                    if(this.status) {
                        status = this.status;
                    }
                    if (!trs[this.connectionID]) {
                        trs[this.connectionID] = "";
                    }
                    trs[this.connectionID] +=  "<tr class='paused' id='" + eqFTP.serviceFunctions.escapeSymbol(this.id) + "'>"+
                                "<td class='name' width='30%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(this.name) + "'><span data-eqFTPQueueRemove='failedQueue' title='" + eqFTP.serviceFunctions.escapeSymbol(eqFTPstrings.QUEUE_REMOVE) + "'>&times;</span>" + this.name + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(from) + "'>" + from + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(to) + "'>" + to + "</span></td>" +
                                "<td class='status' width='30%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(status) + "'>" + status + "</span></td>" +
                            "</tr>";
                }
            });
            $.each(eqFTP.globals.successedQueue,function() {
                if(this!=undefined) {
                    if (this.direction === 'download') {
                        var from = this.remotePath;
                        var to = this.localPath + this.name;
                    } else if (this.direction === 'upload'){
                        var from = this.localPath;
                        var to = this.remotePath;
                    }
                    var status = eqFTPstrings.OTHER_COMPLETED;
					if (this.status == "Cancelled") {
						status = eqFTPstrings.OTHER_CANCELLED;
					}
                    if (!trs[this.connectionID]) {
                        trs[this.connectionID] = "";
                    }
                    trs[this.connectionID] +=  "<tr class='paused' id='" + eqFTP.serviceFunctions.escapeSymbol(this.id) + "'>"+
                                "<td class='name' width='30%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(this.name) + "'><span data-eqFTPQueueRemove='successedQueue' title='" + eqFTP.serviceFunctions.escapeSymbol(eqFTPstrings.QUEUE_REMOVE) + "'>&times;</span>" + this.name + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(from) + "'>" + from + "</span></td>" +
                                "<td class='path' width='25%'><span title='" + eqFTP.serviceFunctions.escapeSymbol(to) + "'>" + to + "</span></td>" +
                                "<td class='status' width='30%'>" + status + "</td>"+
                            "</tr>";
                }
            });
            var thead = "<thead><tr><th queueTabname='Name'><span>" + eqFTPstrings.QUEUE_HEADER_NAME + 
                        "</span></th><th queueTabname='From'><span>" + eqFTPstrings.QUEUE_HEADER_FROM + 
                        "</span></th><th queueTabname='To'><span>" + eqFTPstrings.QUEUE_HEADER_TO + 
                        "</span></th><th queueTabname='Status'><span>" + eqFTPstrings.QUEUE_HEADER_STATUS + 
                        "</span></th></tr></thead>",
                html = "",
                tabs = "",
                id = 0;
            $.each(trs, function (i, o) {
                if (o) {
                    html += "<div id='eqFTPTab-" + i + "' class='eqFTPqueueTab'><table id='eqFTPequeueTable" + i + "'>" + thead + "<tbody>" + o + "</tbody></table></div>";
                    tabs += "<div data-openeqFTPQueueTab='" + i + "'>" + eqFTP.globals.globalFtpDetails.ftp[i].connectionName + "<span class='eqFTPQueueClose'>&times;</span></div>";
                    id = i;
				}
            });
            $('#eqFTPQueueHolder .table-container').html(html);
            $('#eqFTPQueueHolder #eqFTPQueueTabs').html(tabs);
            var keys = Object.keys(trs);
			eqFTP.globals.lastQueueKeys = keys;
            if (keys.indexOf(eqFTP.globals.lastQueueTab) < 0) {
                eqFTP.globals.lastQueueTab = id;
            }
            eqFTP.serviceFunctions.switchTabTo({
                id: eqFTP.globals.lastQueueTab
            });
        },
        switchTabTo: function (params) {
			$.each(eqFTP.globals.lastQueueKeys, function() {
				JColResizer.colResizable($("table#eqFTPequeueTable" + params.id), {
					disable: true
				});
			});
            if (params.id > -1 && $("#eqFTPTab-"+params.id).length === 1 && $("div[data-openeqFTPQueueTab="+params.id+"]").length === 1) {
                eqFTP.globals.lastQueueTab = params.id;
                $(".eqFTPqueueTab").hide();
                $("#eqFTPTab-"+params.id).show();
                $("#eqFTPQueueTabs>div").removeClass('active');
                $("div[data-openeqFTPQueueTab="+params.id+"]").addClass('active');
				$.each(eqFTP.globals.queueTableParams.widths, function(i, o) {
					$("table#eqFTPequeueTable" + params.id).find("th[queueTabname=" + i + "]:first").width(o);
				});
				JColResizer.colResizable($("table#eqFTPequeueTable" + params.id), {
					liveDrag: true,
					onResize: function () {
						eqFTP.serviceFunctions.saveQueueTableSizes();
					}
				});
            }
        },
		saveQueueTableSizes: function () {
			$.each($(".eqFTPqueueTab:visible:first thead th"), function() {
				var name = $(this).attr("queueTabname");
				var width = $(this).width();
				eqFTP.globals.queueTableParams.widths[name] = width + "px";
			});
		},
        toggleQueue: function () {
            if ($("#eqFTPQueueHolder").is(":visible")) {
                queuePanel = false;
				$.each(eqFTP.globals.lastQueueKeys, function(i, o) {
					JColResizer.colResizable($("table#eqFTPequeueTable" + o), {
						disable: true
					});
				});
                Resizer.hide($('#eqFTPQueueHolder'));
            } else {
                queuePanel = true;
                Resizer.show($('#eqFTPQueueHolder'));
                if(queuePanel) {
                    eqFTP.serviceFunctions.redrawQueue();
                }
            }
        },
        contextMenus: function () {
            /*
            * Creating Context Menus
            */

            var eqFTP_modalCmenu_file = Menus.registerContextMenu('equals182-eqftp-file_cmenu');
            eqFTP_modalCmenu_file.addMenuItem("eqftp.downloadFileAndOpen");
            eqFTP_modalCmenu_file.addMenuItem("eqftp.downloadFile");
            eqFTP_modalCmenu_file.addMenuItem("eqftp.addToPausedQueue-d");
            eqFTP_modalCmenu_file.addMenuItem("eqftp.rename");
            eqFTP_modalCmenu_file.addMenuItem("eqftp.delete");
            $("body").on('contextmenu', ".eqFTP-file", function (e) {
                tmp_modalClickedItem = $(this);
                eqFTP_modalCmenu_file.open(e);
            });

            var eqFTP_modalCmenu_folder = Menus.registerContextMenu('equals182-eqftp-folder_cmenu');
            eqFTP_modalCmenu_folder.addMenuItem("eqftp.downloadFile");
            eqFTP_modalCmenu_folder.addMenuItem("eqftp.addToPausedQueue-d");
            eqFTP_modalCmenu_folder.addMenuItem("eqftp.rename");
            eqFTP_modalCmenu_folder.addMenuItem("eqftp.delete");
            $("body").on('contextmenu', ".eqFTP-folder", function (e) {
                tmp_modalClickedItem = $(this);
                eqFTP_modalCmenu_folder.open(e);
            });

            var eqFTP_queueCmenu = Menus.registerContextMenu('equals182-eqftp-queue_cmenu');
            eqFTP_queueCmenu.addMenuItem("eqftp.startQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.pauseQueue");
            eqFTP_queueCmenu.addMenuDivider();
            eqFTP_queueCmenu.addMenuItem("eqftp.clearQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.clearComplitedQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.clearPausedQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.clearFailedQueue");
            eqFTP_queueCmenu.addMenuItem("eqftp.resetFailedQueue");
            $("body").on('contextmenu', "#eqFTPQueueHolder .table-container", function (e) {
                if ( 
                    eqFTP.globals.pausedQueue.length > 0 || 
                    eqFTP.globals.automaticQueue.length > 0 ||
                    eqFTP.globals.successedQueue.length > 0 ||
                    eqFTP.globals.failedQueue.length > 0
                   ) {
                    eqFTP_queueCmenu.open(e);
                }
            });

            var project_contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU);
            project_contextMenu.addMenuDivider();
            project_contextMenu.addMenuItem("eqftp.addToAutomaticQueue-u");
            project_contextMenu.addMenuItem("eqftp.addToPausedQueue-u");
            project_contextMenu.addMenuItem("eqftp.redownloadFile");
            
            var working_contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_CONTEXT_MENU);
            working_contextMenu.addMenuDivider();
            working_contextMenu.addMenuItem("eqftp.addToAutomaticQueue-u");
            working_contextMenu.addMenuItem("eqftp.addToPausedQueue-u");
            working_contextMenu.addMenuItem("eqftp.redownloadFile");
        },
        getLocalDirectory: function(params) {
            var dir = params.directoryObject;
            filesArray = [];
            var files = getLocalDirectoryRecursive(dir,function(files){
                var filesPaths = [];
                $.each(files,function() {
                    var result = eqFTP.serviceFunctions.makeRemotePathFromLocal({
                        localPath: this._path,
                        name: this._name,
                        connectionID: params.connectionID
                    });
                    filesPaths.push({
                        localPath: this._path,
                        remotePath: result.remotePath,
                        name: this._name,
                        direction: params.direction || 'upload',
                        queue: params.queueType,
                        connectionID: params.connectionID
                    });
                });
                if (isFunction(params.callback)) {
                    params.callback(filesPaths);
                }
            });
        },
        getRemoteDirectory: function(params) {
            var ftpPromise = nodeConnection.domains.eqFTP.addToQueue({
                type: "folderRecursive",
                connectionID: eqFTP.globals.connectedServer,
                path: eqFTP.serviceFunctions.normalizePath(params.path),
                filesToQueue: params.queue
            });
        },
        contextLocalAddToQueue: function(params) {
            var doThis = function() {
                var fileEntry = ProjectManager.getSelectedItem();
                if (fileEntry.isDirectory) {
                    var localPath = fileEntry._path;
                    if (ProjectManager.isWithinProject(localPath)) {
                        var projectRoot = ProjectManager.getProjectRoot();
                        eqFTP.serviceFunctions.getConnectionIDbyPath({
                            path: projectRoot._path,
                            callback: function(cbparams) {
                                if(cbparams.connectionID!==false) {
                                    eqFTP.serviceFunctions.getLocalDirectory({
                                        directoryObject: fileEntry, 
                                        connectionID: cbparams.connectionID, 
                                        queueType: params.queueType,
                                        direction: params.direction,
                                        callback: function(filesPaths) {
                                            if (isFunction(params.folderCallback)) {
                                                params.folderCallback(filesPaths);
                                            }
                                        }
                                    });
                                } else {
                                    console.error("[eqFTP] Uploding directory. There's no connectionID.");
                                }
                            }
                        });
                    } else {
                        // Will probably never happen.
                    }
                } else {
                    var localPath = fileEntry._path;
                    var name = fileEntry._name;
                    if (ProjectManager.isWithinProject(localPath)) {
                        var projectRoot = ProjectManager.getProjectRoot();
                        var path = projectRoot._path;
                    } else {
                        var path = localPath;
                    }
                    eqFTP.serviceFunctions.getConnectionIDbyPath({
                        path: path,
                        callback: function(cbparams) {
                            if(cbparams.connectionID !== false) {
                                if(cbparams.tied == false) {
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
                                if (isFunction(params.fileCallback)) {
                                    var result = eqFTP.serviceFunctions.makeRemotePathFromLocal({
                                        localPath: localPath,
                                        name: name,
                                        connectionID: cbparams.connectionID
                                    });
                                    params.fileCallback({
                                        localPath: localPath,
                                        remotePath: result.remotePath,
                                        name: name,
                                        connectionID: cbparams.connectionID
                                    });
                                }
                            }else{
                                console.error("[eqFTP] Uploading file. There's no connectionID.");
                            }
                        }
                    });
                }
            }
            if(eqFTP.globals.settingsLoaded==false) {
                eqFTP.readGlobalRemoteSettings(function(status) {
                    if(status) {
                        doThis();
                    }else{
                        // Add connections abortion in future.
                    }
                });
            }else{
                doThis();
            }
        },
        getConnectionIDbyPath: function(params) {
            var f = false,
                path = eqFTP.serviceFunctions.normalizePath(params.path + "/");
            path = path.replace(/(\/$)/gi, "");
            $.each(eqFTP.globals.projectsPaths, function(i, o) {
                var t_path = eqFTP.serviceFunctions.normalizePath(o + "/");
                t_path = t_path.replace(/(\/$)/gi, "");
                if ( t_path === path ) {
                    f = true;
                    if (params.callback) {
                        params.callback({
                            connectionID: i,
                            tied: true
                        });
                        return false;
                    }
                }
            });
            if (f === false) {
                if (!params.dontUseCurrent) {
                    if (eqFTP.globals.connectedServer !== null) {
                        if (params.callback) {
                            params.callback({
                                connectionID: eqFTP.globals.connectedServer,
                                tied: false
                            });
                        }
                    } else {
                        Dialogs.showModalDialog('DIALOG_ID_ERROR',eqFTPstrings.ERR_DIAG_NOSERVERFOUND_TITLE, eqFTPstrings.ERR_DIAG_NOSERVERFOUND_CONTENT);
                        if (params.callback) {
                            params.callback({
                                connectionID: false,
                                tied: false
                            });
                        }
                    }
                } else {
                    if (params.callback) {
                        params.callback({
                            connectionID: false,
                            tied: false
                        });
                    }
                }
            }
        },
        saveProjectsPaths: function() {
            var paths = [];
            $.each(eqFTP.globals.globalFtpDetails.ftp, function (i,o) {
                if (o.localpath && o.localpath !== "") {
                    paths[i] = o.localpath;
                } else {
                    paths[i] = eqFTP.serviceFunctions.normalizePath(eqFTP.globals.globalFtpDetails.main.folderToProjects + "/" + o.connectionName + "/");
                }
            });
            eqFTP.globals.prefs.set('projectsPaths', paths);
            eqFTP.globals.prefs.save();
        },
        clearQueue: function (params) {
            // processQueue, automaticQueue, pausedQueue, failedQueue, successedQueue
            var keep = false,
                tmp = [];
            if (params.processQueue) {
                tmp = [];
                $.each(eqFTP.globals.processQueue, function(i, o) {
                    if (this!=undefined) {
                        if (this.connectionID == params.connectionID) {
                            if (params.processQueue === "keep") {
                                keep = true;
                            }
                        } else if (params.processQueue === "clear") {
                            tmp.push(o);
                        }
                    }
                });
                if (params.processQueue === "clear") {
                    eqFTP.globals.processQueue = tmp;
                }
            }
            if (params.automaticQueue) {
                tmp = [];
                $.each(eqFTP.globals.automaticQueue, function(i, o) {
                    if (this!=undefined) {
                        if (this.connectionID == params.connectionID) {
                            if (params.automaticQueue === "keep") {
                                keep = true;
                            }
                        } else if (params.automaticQueue === "clear") {
                            tmp.push(o);
                        }
                    }
                });
                if (params.automaticQueue === "clear") {
                    eqFTP.globals.automaticQueue = tmp;
                }
            }
            if (params.pausedQueue) {
                tmp = [];
                $.each(eqFTP.globals.pausedQueue, function(i, o) {
                    if (this!=undefined) {
                        if (this.connectionID == params.connectionID) {
                            if (params.pausedQueue === "keep") {
                                keep = true;
                            }
                        } else if (params.pausedQueue === "clear") {
                            tmp.push(o);
                        }
                    }
                });
                if (params.pausedQueue === "clear") {
                    eqFTP.globals.pausedQueue = tmp;
                }
            }
            if (params.failedQueue) {
                tmp = [];
                $.each(eqFTP.globals.failedQueue, function(i, o) {
                    if (this !== undefined) {
                        if (this.connectionID == params.connectionID) {
                            if (params.failedQueue === "keep") {
                                keep = true;
                            }
                        } else if (params.failedQueue === "clear") {
                            tmp.push(o);
                        }
                    }
                });
                if (params.failedQueue === "clear") {
                    eqFTP.globals.failedQueue = tmp;
                }
            }
            if (params.successedQueue) {
                tmp = [];
                $.each(eqFTP.globals.successedQueue, function(i, o) {
                    if (this!=undefined) {
                        if (this.connectionID == params.connectionID) {
                            if (params.successedQueue === "keep") {
                                keep = true;
                            }
                        } else if (params.successedQueue === "clear") {
                            tmp.push(o);
                        }
                    }
                });
                if (params.successedQueue === "clear") {
                    eqFTP.globals.successedQueue = tmp;
                }
            }
            return keep;
        },
        connectionControl: function (params) {
            if (params.status) {
                if (params.icon) {
                    $('#eqFTPConnectionControl').addClass('on');
                }
                if (params.connectedServer !== null && params.connectedServer !== undefined && params.connectedServer > -1) {
                    eqFTP.globals.connectedServer = params.connectedServer;
                }
            } else {
                if (params.icon) {
                    $('#eqFTPConnectionControl').removeClass('on');
                }
                if (params.table) {
                    $('#eqFTPTable').html('');
                }
                if (params.connectedServer === true) {
                    eqFTP.globals.connectedServer = null;
                }
            }
        },
        addFolder: function (params) {
            if (params.connectionID > -1 && eqFTP.globals.globalFtpDetails.ftp[params.connectionID] !== undefined) {
                params.path = eqFTP.serviceFunctions.normalizePath(params.path);
                params.path = params.path.replace(/(^\/|\/$)/gi,'');
                if (params.path === "" || params.path === "'eqFTP'root'" || params.path === "/") {
                    eqFTP.globals.remoteStructure[params.connectionID] = params.object;
                } else {
                    var pathArray = params.path.split("/");
                    eqFTP.globals.remoteStructure[params.connectionID] = eqFTP.serviceFunctions.recursiveAdd({
                        object: params.object,
                        pathArray: pathArray,
                        deep: 0,
                        connectionID: params.connectionID,
                        searchIn: eqFTP.globals.remoteStructure[params.connectionID],
                        state: params.state || "opened"
                    });
                }
                eqFTP.serviceFunctions.redrawFileTree();
            }
        },
        recursiveAdd: function (params) {
            var dummy = {
                children: params.object || {},
                lastupdated: "",
                lastupdatedShort: "",
                name: "",
                size: "",
                sizeShort: "",
                type: "folder",
                state: params.state || "opened"
            };
            if (params.pathArray && params.pathArray.length > 0) {
                var searchFor = params.pathArray[params.deep],
                    found = false;
                dummy.name = searchFor;
                if (toString.call(params.searchIn) !== "[object Array]") {
                    params.searchIn = [];
                }
                $.each(params.searchIn, function(i, o) {
                    if (o.name === searchFor) {
                        found = true;
                        if (params.pathArray.length === params.deep + 1) {
                            if (params.object) {
                                if (o.children && ( o.children instanceof Array || toString.call(o.children) === "[object Array]" ) && o.children.length > 0) {
                                    if (params.object && params.object.length > 0) {
                                        $.each(o.children, function(ic1, oc1) {
                                            $.each(params.object, function (ic2, oc2) {
                                                if (oc2.name === oc1.name) {
                                                    params.object[ic2].children = oc1.children;
                                                    params.object[ic2].state = oc1.state;
                                                }
                                            });
                                        });
                                    } else {
                                    }
                                }
                                params.searchIn[i].children = params.object;
                            }
                            if (params.state) {
                                params.searchIn[i].state = params.state;
                            }
                        } else {
                            params.searchIn[i].children = eqFTP.serviceFunctions.recursiveAdd({
                                object: params.object,
                                pathArray: params.pathArray,
                                deep: params.deep + 1,
                                connectionID: params.connectionID,
                                searchIn: params.searchIn[i].children,
                                state: params.state
                            });
                        }
                    }
                });
                if (!found) {
                    params.searchIn.push(dummy);
                }
                return params.searchIn;
            } else {
                return dummy;
            }
        },
        recursiveReplace: function(params) {
            var found = false;
            if (params.connectionID && !params.searchIn) {
                params.searchIn = eqFTP.globals.remoteStructure[params.connectionID];
            }
            if (params.searchIn) {
                $.each(params.searchIn, function(i, o) {
                    if (o) {
                        if (params.path) {
                            var path = params.path + "/" + o.name;
                        } else {
                            var path = "" + "/" + o.name;
                        }
                        if (found === false) {
                            if (path === params.changeFrom.path) {
                                if (params.changeTo.remove) {
                                    params.searchIn.splice(i, 1);
                                } else {
                                    params.searchIn[i].name = params.changeTo.name || o.name;
                                }
                                found = true;
                            } else if (o.children && ( o.children instanceof Array || toString.call(o.children) === "[object Array]" ) && o.children.length > 0){
                                params.searchIn[i].children = eqFTP.serviceFunctions.recursiveReplace({
                                    searchIn: params.searchIn[i].children,
                                    connectionID: params.connectionID,
                                    changeFrom: params.changeFrom,
                                    changeTo: params.changeTo,
                                    path: path
                                });
                            }
                        }
                    }
                });
                return params.searchIn;
            } else {
                return [];
            }
        },
        customError: function(params) {
            /*
            * type (notification||error||warning)
            * message
            */
            if (eqFTP.globals.globalFtpDetails.main.notifications == true) {
                if (!params.type) {
                    params.type = "notification";
                }
                if (!params.connectionName) {
                    params.connectionName = "eqFTP";
                }
                var offset = 30;
                $('.eqFTP-customErrorHolder').each(function() {
                    var h = $(this).outerHeight(true);
                    offset = offset + h + 5;
                });
                var i = $('.eqFTP-customErrorHolder').length;
                $("body").append('<div id="eqFTP-customErrorHolder-' + i + '" class="eqFTP-customErrorHolder ' + params.type + '"><div class="text"><strong>' + params.connectionName + ':</strong><br/>' + params.message + '</div><span class="close">&times;</span></div>');
                var h = $('#eqFTP-customErrorHolder-' + i).outerHeight(true) * -1;
                $('#eqFTP-customErrorHolder-' + i).css('bottom', h).css('opacity', 0);
                $('#eqFTP-customErrorHolder-' + i).animate({'bottom': offset, 'opacity': 1}, 200);
                var int = setInterval(function() {
                    if ($('#eqFTP-customErrorHolder-' + i).length === 1) {
                        $('.eqFTP-customErrorHolder').each(function(){
                            if ($(this).not($('#eqFTP-customErrorHolder-' + i))) {
                                var bh = $(this).parents("body").first().innerHeight();
                                var t = $(this).position().top;
                                var eh = $(this).outerHeight(true);
                                var b = bh - (t + eh);
                                b = b + h - 5;
                                $(this).animate({'bottom': b}, 200);                            
                            }
                        });
                        $('#eqFTP-customErrorHolder-' + i).animate({'bottom': h-30, 'opacity': 0}, 200, "swing", function() {
                            $('#eqFTP-customErrorHolder-' + i).remove();
                        });
                    }
                    clearInterval(int);
                }, 5000);
            }
        },
        saveRenames: function() {
            $('.eqFTPModalItemRename').each(function() {
                var el = $(this);
                var o = el.attr('data-eqFTPRenameFromName');
                var n = el.val();
                var p = el.attr('data-eqFTPRenameFrom');
                if (o !== n) {
                    var or = o.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                    var re = new RegExp(or+"$");
                    var np = p.replace(re, n);
                    nodeConnection.domains.eqFTP.rename({
                        connectionID: eqFTP.globals.connectedServer,
                        from: p,
                        to: np,
                        newName: n,
                        oldName: o
                    });
                }
            });
            $('.eqFTPModalItemRename').remove();
            $('.eqFTPModalItemTitle').show();
        }
    };
    
    eqFTP.getPassword = function (callback) {
        if (eqFTP.globals.masterPassword !== null) {
            return eqFTP.globals.masterPassword;
        } else {
            var dialog = Dialogs.showModalDialogUsingTemplate(eqFTPPasswordTemplate, true);
            dialog.done(function (id) {
                if (id === 'ok') {
                    var pass = dialog._$dlg[0].children[1].children[0].children[1].value;
                    eqFTP.globals.masterPassword = pass;
                    callback(pass);
                    return true;
                } else if (id === 'close') {
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
        nodeConnection.domains.eqFTP.addConnections({connections:eqFTP.globals.globalFtpDetails.ftp});
        nodeConnection.domains.eqFTP.updateSettings({debug:eqFTP.globals.globalFtpDetails.main.debug});
        eqFTP.processSettingsFile({text:ftpData,direction:'to'},function(result) {
            if(result) {
                FileUtils.writeText(fileEntry, result).done(function () {
                    eqFTP.serviceFunctions.saveProjectsPaths();
                });
            }
        });
        eqFTP.serviceFunctions.redrawFileTree();
        return true;
    };
    
    eqFTP.readGlobalRemoteSettings = function(callback) {
        eqFTP.globals.defaultSettingsPath = eqFTP.serviceFunctions.normalizePath(eqFTP.globals.defaultSettingsPath);
        var fileEntry = new FileSystem.getFileForPath(eqFTP.globals.defaultSettingsPath + "/" + eqFTP.globals.settingsFilename);
        if (fileEntry) {
            var readSettingsPromise = FileUtils.readAsText(fileEntry);
            readSettingsPromise.done(function (result) {
                if (result) {
                    eqFTP.processSettingsFile({'text':result,'direction':'from'}, function(result) {
                        if(result) {
                            eqFTP.globals.globalFtpDetails = $.parseJSON(result);
                            eqFTP.globals.settingsLoaded = true;
                            nodeConnection.domains.eqFTP.addConnections({connections:eqFTP.globals.globalFtpDetails.ftp});
                            nodeConnection.domains.eqFTP.updateSettings({debug:eqFTP.globals.globalFtpDetails.main.debug});
                            eqFTP.serviceFunctions.saveProjectsPaths();
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
    
    eqFTP.showModal = function (e) {
        var t = 0;
        if ($('#detachedModal').length < 1) {
            $('body').append('<div id="detachedModalHolder"><div id="detachedModal"></div></div>');
            $('body').on('click', "#detachedModalHolder", function(e) {
                var t = e.target;
                var p = $(t).parent();
                if ($(p).is("body") && allowDMHide) {
                    eqFTP.globals.scrllTop = $('#eqFTP-project-dialog>.modal-body').scrollTop();
                    $('#detachedModalHolder').hide();
                }
            });
        }
        var t = e.target,
            width = 300,
            gap = 20,
            c_x = $("#detachedModalHolder").innerWidth() - $(t).offset().left,
            c_y = $("#detachedModalHolder").offset().top,
            r = c_x + gap,
            t = c_y + gap,
            maxH = $(window).innerHeight() - 100,
            maxW = $(window).innerWidth() - 100;
        
        if (DMh > maxH) {
            DMh = maxH;
        }
        if (DMw > maxW) {
            DMw = maxW;
        }
        
        $('#detachedModal').css('top', t).css('right', r).css('height', DMh).css('width', DMw);
        $('#detachedModal').html(eqFTPModalTemplate);
        $('#detachedModalHolder').show();
        $('#detachedModalHolder>#detachedModal>.modal').css('width', width);
        $('#eqFTPDirectoryListing').css('min-height', 400);
        if (!isNaN(parseInt(eqFTP.globals.connectedServer))) {
            eqFTP.serviceFunctions.connectionControl({
                icon: true,
                status: true
            });
        }
        
        eqFTP.serviceFunctions.ftpLoaded(eqFTP.globals.ftpLoaded);
    }
    
    eqFTP.ftpFunctions = {
        changeDirectory: function (params) {
            eqFTP.globals.scrllTop = $('#eqFTP-project-dialog>.modal-body').scrollTop();
            if(isNaN(parseInt(eqFTP.globals.connectedServer))) {
                return false;
            }
            $("#eqFTP-filebrowser .table-container").toggleClass("loading");
            $("#eqFTP-filebrowser .table-container table").fadeOut(100);
            var ftp = eqFTP.globals.globalFtpDetails.ftp[eqFTP.globals.connectedServer],
                shortPath = params.path,
                paths = params.paths;
            if (paths !== undefined && paths.length > 0) {
                $.each(paths, function(i, o) {
                    $('#eqFTPLoading').show();
                    var ftpPromise = nodeConnection.domains.eqFTP.addToQueue({
                        type: "folder",
                        connectionID: eqFTP.globals.connectedServer,
                        path: o
                    });
                });
            } else if (shortPath !== undefined) {
                var newPath = shortPath;
                console.log("[eqFTP] Changing directory to: " + newPath);    

                var t = $('div[data-path="'+shortPath+'"]').parent();
                var ul = $(t).children('ul:first');
                
                if(!params.reload) {
                    if($(t).length == 1 && $(t).hasClass('opened')) {
                        eqFTP.serviceFunctions.addFolder({
                            connectionID: eqFTP.globals.connectedServer,
                            path: newPath,
                            state: "closed"
                        });
                        t.removeClass('opened').addClass('closed');
                        return false;
                    }else if($(ul).length>0){
                        eqFTP.serviceFunctions.addFolder({
                            connectionID: eqFTP.globals.connectedServer,
                            path: newPath,
                            state: "opened"
                        });
                        t.addClass('opened').removeClass('closed');
                        return false;
                    }
                }
                $('#eqFTPLoading').show();
                var ftpPromise = nodeConnection.domains.eqFTP.addToQueue({
                    type: "folder",
                    connectionID: eqFTP.globals.connectedServer,
                    path: newPath
                });
            }
        },
        addToQueue: function(arrayOfQueuers) {
            /**
            * @ params {object}:
            *   name    {string}
            *   connectionID    {integer}
            *   remotePath  {string}
            *   localPath   {string}
            *   status  {boolean}
            *   queue   {string}    ( automatic | paused )
            *   direction   {string}    ( download | upload )
            */
            var startQueueInterval = false;
            var salt = 0;
            var doThis = function() {
                $.each(arrayOfQueuers, function () {
                    this.remotePath = eqFTP.serviceFunctions.normalizePath(this.remotePath);
                    this.localPath = eqFTP.serviceFunctions.normalizePath(this.localPath);
                    this.id = eqFTP.serviceFunctions.generateUniqueId({
                        salt: salt
                    });
                    salt++;
					if (this.direction === 'download') {
						if (!eqFTP.globals.globalFtpDetails.ftp[this.connectionID].connectToServerEvenIfDisconnected && this.connectionID !== eqFTP.globals.connectedServer) {
							console.warn("[eqFTP] You're not allowing me to upload files on this server when you're not connected to it.");
							this.status = eqFTPstrings.OTHER_ERROR_EVENDISCONN;
                            eqFTP.serviceFunctions.customError({
                                type: "notification",
                                message: eqFTPstrings.OTHER_ERROR_EVENDISCONN,
                                connectionName: eqFTP.globals.globalFtpDetails.ftp[this.connectionID].connectionName
                            });
							eqFTP.globals.failedQueue.unshift(this);
                            return true; //continue
						} else {
                            var path = this.remotePath,
                                pathArray = path.split("/"),
                                fileName = pathArray.pop(),
                                root = eqFTP.globals.globalFtpDetails.ftp[this.connectionID].localpath;
                            if (root === "") {
                                root = eqFTP.globals.globalFtpDetails.main.folderToProjects + "/" + eqFTP.globals.globalFtpDetails.ftp[this.connectionID].connectionName;
                            }
                            root = eqFTP.serviceFunctions.normalizePath(root);
                            this.remotePath = eqFTP.serviceFunctions.normalizePath(path);
                            this.localPath = eqFTP.serviceFunctions.normalizePath(root + "/" + pathArray.join("/") + "/");
                            this.remoteRoot = eqFTP.globals.globalFtpDetails.ftp[this.connectionID].remotepath;
                            this.name = fileName;
                        }
					} else if (this.direction === "upload") {
						if (!eqFTP.globals.globalFtpDetails.ftp[this.connectionID].connectToServerEvenIfDisconnected && this.connectionID !== eqFTP.globals.connectedServer) {
							console.warn("[eqFTP] You're not allowing me to upload files on this server when you're not connected to it.");
							this.status = eqFTPstrings.OTHER_ERROR_EVENDISCONN;
                            eqFTP.serviceFunctions.customError({
                                type: "notification",
                                message: eqFTPstrings.OTHER_ERROR_EVENDISCONN,
                                connectionName: eqFTP.globals.globalFtpDetails.ftp[this.connectionID].connectionName
                            });
							eqFTP.globals.failedQueue.unshift(this);
                            return true; //continue
						} else {
							if(this.remotePath === undefined || this.remotePath === "") {
                                var result = eqFTP.serviceFunctions.makeRemotePathFromLocal({
                                    localPath: this.localPath,
                                    name: this.name,
                                    connectionID: this.connectionID
                                });
                                this.remotePath = eqFTP.serviceFunctions.normalizePath(result.remotePath);
                                this.localPath = eqFTP.serviceFunctions.normalizePath(this.localPath);
                                this.remoteRoot = result.remoteRoot;
							}
						}
					}
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
            }
            if(eqFTP.globals.settingsLoaded==false) {
                eqFTP.readGlobalRemoteSettings(function(status) {
                    if(status) {
                        doThis();
                    }else{
                        // Add connections abortion in future.
                    }
                });
            }else{
                doThis();
            }
        },
        startQueue: function(params) {
            if (eqFTP.globals.automaticQueue && eqFTP.globals.automaticQueue.length > 0) {
                var item = eqFTP.globals.automaticQueue.shift();
                if (!isNaN(parseInt(item.connectionID))) {
                    item.connection = eqFTP.globals.globalFtpDetails.ftp[item.connectionID];
                    if (item.direction === 'download') {

                        nodeConnection.domains.eqFTP.addToQueue({
                            type: "file",
                            direction: item.direction,
                            connectionID: item.connectionID,
                            localPath: item.localPath,
                            remotePath: item.remotePath,
                            openAfter: item.openAfter,
                            id: item.id,
                            name: item.name,
                            callback: function(result) {

                            }
                        });
                    } else if (item.direction === "upload") {
                        //console.log('[eqFTP-test] Params: '+JSON.stringify(obj));

                        nodeConnection.domains.eqFTP.addToQueue({
                            type: "file",
                            direction: item.direction,
                            connectionID: item.connectionID,
                            localPath: item.localPath,
                            remotePath: item.remotePath,
                            id: item.id,
							name: item.name,
                            callback: function(result) {

                            }
                        });
                    }
                    eqFTP.globals.processQueue.push(item);
                }
                eqFTP.ftpFunctions.startQueue();
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
    
    $("body").on('click', '.eqFTP-customErrorHolder .close', function() {
        $(this).parent().remove();
    });
    
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
            $('#eqFTP-keepAlive').val(setting.keepAlive);
            $('#eqFTP-timeOffset').val(setting.timeOffset);
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
            if (setting.useList) {
                $("#eqFTP-useList").prop("checked", true);
            } else {
                $("#eqFTP-useList").prop("checked", false);
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
            $('#eqFTP-keepAlive').val(10);
            $('#eqFTP-timeOffset').val(0);
            $("#eqFTP-connectToServerEvenIfDisconnected").prop('checked',false);
            $("#eqFTP-protocol option").prop('selected', false);
            $("#eqFTP-protocol option[value=FTP]").prop('selected', true);
            $("#eqFTP-uploadonsave").prop("checked", false);
            $("#eqFTP-useList").prop("checked", false);
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
        eqFTP.serviceFunctions.connectionControl({
            icon: true,
            status: true
        });
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
            nodeConnection.domains.eqFTP.disconnect({connectionID: eqFTP.globals.connectedServer});
            eqFTP.serviceFunctions.clearQueue({
                // processQueue, automaticQueue, pausedQueue, failedQueue, successedQueue
                processQueue: "clear",
                automaticQueue: "clear",
                pausedQueue: "clear",
                failedQueue: "clear",
                successedQueue: "clear",
                connectionID: eqFTP.globals.connectedServer
            });
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
            
            eqFTP.serviceFunctions.connectionControl({
                icon: true,
                table: true,
                connectedServer: true,
                status: false
            });
        }else{
            var id = parseInt($('#eqFTP-serverChoosing').val());
            if(isNaN(id)) {
                eqFTP.globals.connectedServer = null;
            }else{
                eqFTP.serviceFunctions.connectionControl({
                    icon: true,
                    connectedServer: id,
                    status: true
                });
                nodeConnection.domains.eqFTP.connect({connectionID: eqFTP.globals.connectedServer});
                eqFTP.serviceFunctions.redrawFileTree();
            }
        }
    });
    
    $('body').on('click','#eqFTPRefresh',function() {
        if(!isNaN(parseInt(eqFTP.globals.connectedServer))) {
            eqFTP.ftpFunctions.changeDirectory({
                paths: [""].concat(recursiveSearch({
                    searchIn: eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer],
                    state: "opened"
                })), 
                reload: true
            });
        }
    });
    
    $('body').on('click', '.eqFTP-icon-close', function () {
        var id = parseInt($(this).parent().attr('data-eqFTP-openSettings'));
        if (!isNaN(id)) {
            var r = confirm(eqFTPstrings.SETTINGSWIND_DELETECONNCONF_1 + '"' + eqFTP.globals.globalFtpDetails.ftp[id].connectionName + '"' + eqFTPstrings.SETTINGSWIND_DELETECONNCONF_2);
            if (r === true) {
                eqFTP.globals.globalFtpDetails.ftp.splice(id, 1);
                eqFTP.saveGlobalRemoteSettings();
                eqFTP.serviceFunctions.triggerSettingsNotification({type: "notification", state: true, text: eqFTPstrings.SETTINGSWIND_NOTIF_DONE});
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
                
                var tmp_keepAlive = $("#eqFTP-keepAlive").val();
                var tmp_timeOffset = $("#eqFTP-timeOffset").val();
                
                var tmp_connectToServerEvenIfDisconnected = false;
                if($("#eqFTP-connectToServerEvenIfDisconnected").is(':checked')) {
                    var tmp_connectToServerEvenIfDisconnected = true;
                }
                var tmp_uploadonsave = false;
                if($("#eqFTP-uploadonsave").is(':checked')) {
                    var tmp_uploadonsave = true;
                }
                var tmp_useList = false;
                if($("#eqFTP-useList").is(':checked')) {
                    var tmp_useList = true;
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
                    connectToServerEvenIfDisconnected: tmp_connectToServerEvenIfDisconnected,
                    useList: tmp_useList,
                    keepAlive: tmp_keepAlive,
                    timeOffset: tmp_timeOffset
                };
                eqFTP.globals.globalFtpDetails.ftp[tmp_connectionID] = tmp;
            }
        }
        
        if ($('#eqFTP-SettingsFolder').val() !== "") {
            eqFTP.globals.prefs.set('defaultSettingsPathPref',$('#eqFTP-SettingsFolder').val());
        } else {
            eqFTP.globals.prefs.set('defaultSettingsPathPref',defaultProjectsDir);
        }
        if ($('#eqFTP-useEncryption').is(':checked')) {
            eqFTP.globals.prefs.set('useEncryption',true);
        } else {
            eqFTP.globals.masterPassword = null;
            eqFTP.globals.prefs.set('useEncryption',false);
        }
        eqFTP.globals.prefs.save();
        eqFTP.serviceFunctions.saveProjectsPaths();
        
        eqFTP.globals.globalFtpDetails.main.debug = false;
        if($("#eqFTP-debug").is(':checked')) {
            eqFTP.globals.globalFtpDetails.main.debug = true;
        }
        eqFTP.globals.globalFtpDetails.main.autoClear = false;
        if($("#eqFTP-autoClear").is(':checked')) {
            eqFTP.globals.globalFtpDetails.main.autoClear = true;
        }
        eqFTP.globals.globalFtpDetails.main.notifications = false;
        if($("#eqFTP-notifications").is(':checked')) {
            eqFTP.globals.globalFtpDetails.main.notifications = true;
        }
        
        eqFTP.globals.globalFtpDetails.main.timeFormat = $("#eqFTP-timeFormat option:selected").val();
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
        nodeConnection.domains.eqFTP.addConnections({connections:eqFTP.globals.globalFtpDetails.ftp});
        nodeConnection.domains.eqFTP.updateSettings({debug:eqFTP.globals.globalFtpDetails.main.debug});
        eqFTP.serviceFunctions.redrawFileTree();
    });
    
    $("body").on('click','.eqFTPUseDirectoryOpener',function() {
        var t = $(this);
        var tmp_dpath = eqFTP.serviceFunctions.normalizePath(t.val());
        FileSystem.showOpenDialog(false,true,t.attr('data-eqFTP_ODT'),tmp_dpath,null,function(str, arr){
            t.val(arr[0]);
        });
    });
    
    $("body").on("click", "#eqFTPautolocalpath", function () {
        var projectRoot = ProjectManager.getProjectRoot();
        projectRoot = projectRoot._path;
        var f = false;
        var n = $('#eqFTP-connectionName').val();
        $.each(eqFTP.globals.globalFtpDetails.ftp, function () {
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
    
    $("body").on("click", "div[data-openeqftpqueuetab]", function () {
        var id = $(this).attr("data-openeqftpqueuetab");
        eqFTP.serviceFunctions.switchTabTo({id: id});
    });
    
    $("body").on("click", ".eqFTPQueueClose", function () {
        var id = $(this).parent().attr("data-openeqftpqueuetab");
        eqFTP.serviceFunctions.clearQueue({
            // processQueue, automaticQueue, pausedQueue, failedQueue, successedQueue
            processQueue: "keep",
            automaticQueue: "keep",
            pausedQueue: "clear",
            failedQueue: "clear",
            successedQueue: "clear",
            connectionID: eqFTP.globals.lastQueueTab
        });
        if(queuePanel) {
            eqFTP.serviceFunctions.redrawQueue();
        }
    });
	
	$("body").on("click", "span[data-eqFTPQueueRemove]", function () {
		var queueType = $(this).attr("data-eqFTPQueueRemove");
		var id = $(this).parents("tr:first").attr("id");
		$.each(eqFTP.globals[queueType], function(i, o) {
			if (o.id === id) {
				eqFTP.globals[queueType].splice(i, 1);
				nodeConnection.domains.eqFTP.removeFromQueue({id: id, connectionID: eqFTP.globals.lastQueueTab});
				return false;
			}
		});
		eqFTP.serviceFunctions.redrawQueue();
	});
    
    
    $("body").on("mousewheel", "#eqFTP-project-dialog>.modal-body", function() {
        eqFTP.globals.scrllTop = $('#eqFTP-project-dialog>.modal-body').scrollTop();
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
        
        $("body").on('dblclick', ".eqFTP-folder", function (e) {
            var t = e.target;
            if (!$(t).hasClass('eqFTPModalItemRename')) {
                eqFTP.ftpFunctions.changeDirectory({path:$(this).attr("data-path")});
            }
        });
        
        $("body").on('click', ".eqFTPFileTreePlusMinus", function () {            
            eqFTP.ftpFunctions.changeDirectory({path:$(this).parent().attr("data-path")});
        });
        
        $("body").on('dblclick', ".eqFTP-file", function (e) {
            var t = e.target;
            if (!$(t).hasClass('eqFTPModalItemRename')) {
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
            }
        });
        
        $("body").on("click", "#detachedModalHolder", function(e) {
            var t = e.target;
            if (!$(t).hasClass('eqFTPModalItemRename')) {
                eqFTP.serviceFunctions.saveRenames();
            }
        });
        
        $("body").on("keyup", ".eqFTPModalItemRename", function(e) {
            if (e.keyCode == 13) { 
                eqFTP.serviceFunctions.saveRenames();
            }
            if (e.keyCode == 27) {
                $(this).parent().find('.eqFTPModalItemTitle:first').show();
                $(this).remove();
            }
        });
        
        $("body").on("mousedown", "#eqFTP-dmhandle", function (e) {
            e.preventDefault();
            var ox = e.pageX,
                oy = e.pageY,
                p = $(this).parents("#detachedModal:first"),
                ph = $(p).innerHeight(),
                pw = $(p).innerWidth();
            allowDMHide = false;
            $("body").on("mousemove", "#detachedModalHolder", function(e) {
                var x = e.pageX,
                    y = e.pageY,
                    dx = x - ox,
                    dy = y - oy;
                $(p).height(ph + dy).width(pw - dx);
            });
        });
        
        $("body").on("mouseup", function() {
            $("body").off("mousemove", "#detachedModalHolder");
            if ($("#detachedModal").is(":visible")) {
                DMh = $("#detachedModal").innerHeight();
                DMw = $("#detachedModal").innerWidth();
            }
            var i = setInterval(function() {
                allowDMHide = true;
                clearInterval(i);
            }, 100);
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
        CommandManager.register(eqFTPstrings.CONTEXTM_RENAME, "eqftp.rename", function() {
            eqFTP.serviceFunctions.saveRenames();
            var remotePath = tmp_modalClickedItem.attr('data-path');
            var holder = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first');
            var name = holder.text();
            holder.hide();
            tmp_modalClickedItem.append('<input class="eqFTPModalItemRename" value="' + name + '" data-eqFTPRenameFrom="'+remotePath+'" data-eqFTPRenameFromName="'+name+'">');
            var t = tmp_modalClickedItem.find('.eqFTPModalItemRename:first');
            var v = t.val();
            var end = v.length;
            var beforeDot = v.match(/(.*)\./i);
            if (beforeDot && beforeDot[1]) {
                end = beforeDot[1].length;
            }
            t.focus();
            var dom = $(t).get(0);
            dom.selectionStart = 0;
            dom.selectionEnd = end;
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_DELETE, "eqftp.delete", function() {
            var name = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first').text();
            var remotePath = tmp_modalClickedItem.attr('data-path');
            var r = confirm(name + ":\n" + eqFTPstrings.OTHER_CONFIRM_DELETE);
            if (r === true) {
                if(tmp_modalClickedItem.hasClass('eqFTP-folder')) {
                    // Folder
                    nodeConnection.domains.eqFTP.delete({
                        connectionID: eqFTP.globals.connectedServer,
                        path: eqFTP.serviceFunctions.normalizePath(remotePath),
                        type: "folder",
                        initial: true
                    });
                }else if(tmp_modalClickedItem.hasClass('eqFTP-file')) {
                    // File
                    nodeConnection.domains.eqFTP.delete({
                        connectionID: eqFTP.globals.connectedServer,
                        path: eqFTP.serviceFunctions.normalizePath(remotePath),
                        type: "file"
                    });
                }
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_STARTQ, "eqftp.startQueue", function() {
            var tmpQ = [];
            $.each(eqFTP.globals.pausedQueue, function() {
                this.queue = "automatic";
                tmpQ.push(this);
            });
            eqFTP.globals.pausedQueue = [];
            eqFTP.serviceFunctions.redrawQueue();
            eqFTP.ftpFunctions.addToQueue(tmpQ);
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_PAUSEQ, "eqftp.pauseQueue", function() { 
            nodeConnection.domains.eqFTP.removeFromQueue({id: "pause", connectionID: eqFTP.globals.lastQueueTab});
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_CLEARQ, "eqftp.clearQueue", function() {
            nodeConnection.domains.eqFTP.removeFromQueue({id: "all", connectionID: eqFTP.globals.lastQueueTab});
            eqFTP.serviceFunctions.clearQueue({
                // processQueue, automaticQueue, pausedQueue, failedQueue, successedQueue
                processQueue: "clear",
                automaticQueue: "clear",
                pausedQueue: "clear",
                failedQueue: "clear",
                successedQueue: "clear",
                connectionID: eqFTP.globals.lastQueueTab
            });
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_CLEARCOMPQ, "eqftp.clearComplitedQueue", function() { 
            eqFTP.serviceFunctions.clearQueue({
                successedQueue: "clear",
                connectionID: eqFTP.globals.lastQueueTab
            });
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_CLEARFAILQ, "eqftp.clearFailedQueue", function() { 
            eqFTP.serviceFunctions.clearQueue({
                failedQueue: "clear",
                connectionID: eqFTP.globals.lastQueueTab
            });
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_CLEARPAUSQ, "eqftp.clearPausedQueue", function() { 
            eqFTP.serviceFunctions.clearQueue({
                pausedQueue: "clear",
                connectionID: eqFTP.globals.lastQueueTab
            });
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_RESTARTFAILQ, "eqftp.resetFailedQueue", function() {
            $.each(eqFTP.globals.failedQueue, function(i, e) {
                if (e.connectionID == eqFTP.globals.lastQueueTab) {
                    var tmp = e;
                    tmp.queue = "automatic";
                    eqFTP.globals.failedQueue.splice(i, 1);
                    eqFTP.ftpFunctions.addToQueue([tmp]);
                }
            });
            if(queuePanel) {
                eqFTP.serviceFunctions.redrawQueue();
            }
        });        
        CommandManager.register(eqFTPstrings.CONTEXTM_ADDQUEUE, "eqftp.addToPausedQueue-u", function() {
            eqFTP.serviceFunctions.contextLocalAddToQueue({
                queueType: 'paused',
                direction: 'upload',
                folderCallback: function(filesPaths) {
                    eqFTP.ftpFunctions.addToQueue(filesPaths);
                },
                fileCallback: function(params) {
                    eqFTP.ftpFunctions.addToQueue([
                        {
                            localPath: params.localPath,
                            remotePath: params.remotePath,
                            name: params.name,
                            direction: 'upload',
                            queue: 'paused',
                            connectionID: params.connectionID
                        }
                    ]);
                }
            });
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_UPLOAD, "eqftp.addToAutomaticQueue-u", function() {
            eqFTP.serviceFunctions.contextLocalAddToQueue({
                queueType: 'automatic',
                direction: 'upload',
                folderCallback: function(filesPaths) {
                    eqFTP.ftpFunctions.addToQueue(filesPaths);
                },
                fileCallback: function(params) {
                    eqFTP.ftpFunctions.addToQueue([
                        {
                            localPath: params.localPath,
                            remotePath: params.remotePath,
                            name: params.name,
                            direction: 'upload',
                            queue: 'automatic',
                            connectionID: params.connectionID
                        }
                    ]);
                }
            });
        });        
        CommandManager.register(eqFTPstrings.CONTEXTM_REDOWNLOAD, "eqftp.redownloadFile", function() {
            eqFTP.serviceFunctions.contextLocalAddToQueue({
                queueType: 'automatic',
                direction: 'download',
                folderCallback: function(filesPaths) {
                    eqFTP.ftpFunctions.addToQueue(filesPaths);
                },
                fileCallback: function(params) {
                    eqFTP.ftpFunctions.addToQueue([
                        {
                            localPath: params.localPath,
                            remotePath: params.remotePath,
                            name: params.name,
                            direction: 'download',
                            queue: 'automatic',
                            connectionID: params.connectionID
                        }
                    ]);
                }
            });
        });        

        /*
        * Creating Queue Manager
        */
        
        var eqFTPQueue = WorkspaceManager.createBottomPanel("eqFTP.eqFTPQueue", $(eqFTPQueueTemplate), 200);
        
        var eqFTPQueueButton = $("<div id='eqFTPQueueIndicator' title='"+eqFTPstrings.QUEUE_TITLE_HOVER+"' class='disabled'>"+eqFTPstrings.QUEUE_TITLE+"</div>");
        StatusBar.addIndicator('eqFTPQueueIndicator', eqFTPQueueButton, true);
        
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
                console.log("[eqFTP] Loaded (v"+eqftpVersion+")");
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
                var sanitizedFolders = new Array();
                var sanitizedFiles = new Array();
                var files = result.files;
                //Get all files
                $.each(files, function (index, value) {
                    if (value !== null) {
                        if (value.type === 0) {
                            var sizeShort = eqFTP.serviceFunctions.shortenFilesize({input:value.size,type:'short'});
                            var fileObject = {
                                name: value.name,
                                lastupdatedShort: value.time,
                                lastupdated: value.time,
                                sizeShort : sizeShort,
                                size: value.size,
                                type: "file",
                            };

                            sanitizedFiles.push(fileObject);
                        } else if (value.type === 1) {  
                            var fileObject = {
                                name: value.name,
                                lastupdatedShort: value.time,
                                lastupdated: value.time,
                                size: "",
                                sizeShort : "",
                                type: "folder",
                                children: {},
                            };

                            sanitizedFolders.push(fileObject);
                        }
                    }
                });
                
                var state = 'opened';
                if (result.filesToQueue === 'automatic' || result.filesToQueue === 'paused') {
                    state = 'closed';
                    var addToQueue = [];
                    $.each(sanitizedFiles, function() {
                        var item = this;
                        addToQueue.push({
                            connectionID: result.connectionID,
                            name: item.name,
                            remotePath: result.path + "/" + item.name,
                            status: false,
                            queue: result.filesToQueue,
                            direction: 'download'
                        });
                    });
                    eqFTP.ftpFunctions.addToQueue(addToQueue);
                }
                
                var thisFolderStructure = sanitizedFolders.concat(sanitizedFiles);
                if (!eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer]) {
                    eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] = [];
                }
                eqFTP.serviceFunctions.addFolder({
                    connectionID: result.connectionID,
                    path: result.path,
                    object: thisFolderStructure,
                    state: "opened"
                });
                $('#eqFTPLoading').hide();
            }
        });
        
        $(nodeConnection).on("eqFTP.transferProgress", function (event, params) {
            var data = params.data,
				element = params.element;
            $.each(eqFTP.globals.processQueue, function(index, t) {
                if(t.id == element.id) {
                    eqFTP.globals.processQueue[index].transferData = data;
					if(queuePanel) {
                        var d = data.transferred,
                            t = data.total,
                            status = Math.floor(d * 100 / t);
                        if (status > 100) { status = 100; }
                        var percent = status;
                        status += "%";
						var e = $("table#eqFTPequeueTable" + element.connectionID).find("tr#" + element.id + ":first .progessBar:first");
						e.width(status);
						e.parent().find("span:first").text(status);
					}
                }
            });
        });
        
        $(nodeConnection).on("eqFTP.getDirectoryRecursive", function (event, params) {
            if(params.err==null) {
                eqFTP.ftpFunctions.addToQueue(params.files);
            }
        });
                
        $(nodeConnection).on("eqFTP.otherEvents", function (event, params) {
            if (params.event === 'connectError') {
                var connectionName = eqFTP.globals.globalFtpDetails.ftp[params.connectionID].connectionName;
                if (params.err.code === "ENOTFOUND") {
                    //Dialogs.showModalDialog('DIALOG_ID_ERROR', eqFTPstrings.ERR_DIAG_SERVNOEXIST_TITLE, eqFTPstrings.ERR_DIAG_SERVNOEXIST_CONTENT);
                   eqFTP.serviceFunctions.customError({
                        type: "error",
                        message: eqFTPstrings.ERR_DIAG_SERVNOEXIST_CONTENT,
                        connectionName: connectionName
                    });
                } else if (params.err.code === "EACCES") {
                    //Dialogs.showModalDialog('DIALOG_ID_ERROR', eqFTPstrings.ERR_DIAG_SERVCANTREACH_TITLE, eqFTPstrings.ERR_DIAG_SERVCANTREACH_CONTENT);
                    eqFTP.serviceFunctions.customError({
                        type: "error",
                        message: eqFTPstrings.ERR_DIAG_SERVCANTREACH_CONTENT
                    });
                } else if (params.err.code === "ECONNRESET") {
                    //Dialogs.showModalDialog('DIALOG_ID_ERROR', eqFTPstrings.ERR_DIAG_ECONNRESET_TITLE, eqFTPstrings.ERR_DIAG_ECONNRESET_CONTENT);
                    eqFTP.serviceFunctions.customError({
                        type: "error",
                        message: eqFTPstrings.ERR_DIAG_ECONNRESET_CONTENT,
                        connectionName: connectionName
                    });
                } else if (params.err.code === "ECONNABORTED") {
                    //Dialogs.showModalDialog('DIALOG_ID_ERROR', eqFTPstrings.ERR_DIAG_ECONNRESET_TITLE, eqFTPstrings.ERR_DIAG_ECONNRESET_CONTENT);
                    eqFTP.serviceFunctions.customError({
                        type: "error",
                        message: eqFTPstrings.ERR_DIAG_ECONNABORTED_CONTENT,
                        connectionName: connectionName
                    });
                } else {
                    eqFTP.serviceFunctions.customError({
                        type: "error",
                        message: JSON.stringify(params.err)
                    });
                    //Dialogs.showModalDialog('DIALOG_ID_ERROR', eqFTPstrings.ERR_DIAG_UNIVERSAL_TITLE, eqFTPstrings.ERR_DIAG_UNIVERSAL_CONTENT + "<br>" + JSON.stringify(params.err));
                }
            } else if (params.event === "authError") {
                //Dialogs.showModalDialog('DIALOG_ID_ERROR',eqFTPstrings.ERR_DIAG_AUTHORIZEERR_TITLE, eqFTPstrings.ERR_DIAG_AUTHORIZEERR_CONTENT);
                eqFTP.serviceFunctions.customError({
                    type: "error",
                    message: eqFTPstrings.ERR_DIAG_AUTHORIZEERR_CONTENT,
                    connectionName: connectionName
                });
            } else if (params.event === "disconnect") {
                console.log("[eqFTP] Disconnected from server");
                eqFTP.serviceFunctions.customError({
                    type: "notification",
                    message: eqFTPstrings.NOT_DIAG_DISCONNECTED,
                    connectionName: connectionName
                });
            } else if (params.event === "connect") {
                eqFTP.serviceFunctions.customError({
                    type: "notification",
                    message: eqFTPstrings.NOT_DIAG_CONNECTED,
                    connectionName: connectionName
                });
                console.log("[eqFTP] Connected to server");
            } else if (params.event === "refreshFileTree") {
                eqFTP.globals.remoteStructure[params.id] = [];
                if (eqFTP.globals.connectedServer === params.id) {
                    eqFTP.ftpFunctions.changeDirectory({path:""});
                }
            } else if (params.event === "rename") {
                if (!params.err) {
                    eqFTP.globals.remoteStructure[params.files.connectionID] = eqFTP.serviceFunctions.recursiveReplace({
                        searchIn: eqFTP.globals.remoteStructure[params.files.connectionID],
                        connectionID: params.files.connectionID,
                        changeFrom: {
                            name: params.files.oldName,
                            path: eqFTP.serviceFunctions.normalizePath(params.files.path)
                        },
                        changeTo: {
                            name: params.files.newName
                        }
                    });
                    eqFTP.serviceFunctions.redrawFileTree();
                }
            } else if (params.event === "delete") {
                if (!params.err) {
                    eqFTP.globals.remoteStructure[params.files.connectionID] = eqFTP.serviceFunctions.recursiveReplace({
                        searchIn: eqFTP.globals.remoteStructure[params.files.connectionID],
                        connectionID: params.files.connectionID,
                        changeFrom: {
                            path: params.files.path
                        },
                        changeTo: {
                            remove: true
                        }
                    });
                    eqFTP.serviceFunctions.redrawFileTree();
                }
            }
            $('#eqFTPLoading').hide();
        });

        $(nodeConnection).on("eqFTP.queueEvent", function (event, params) {
            if(params.status == "queueDone") {
                $("#toolbar-eqFTP").addClass("complete");
                var toolbarResetTimeout = setInterval(function () {
                    $("#toolbar-eqFTP").removeClass("complete");
                    clearInterval(toolbarResetTimeout);
                }, 2000);
            } else {
				if (params.element) {
					$.each(eqFTP.globals.processQueue, function (i, o) {
						if (params.element.id == o.id) {
							eqFTP.globals.processQueue.splice(i, 1);
							return false;
						}
					});
				}
			}
			if (params.status == "uploadComplete") {
				if (params.element) {
					var path = FileUtils.getDirectoryPath(params.element.remotePath);
					if (eqFTP.globals.connectedServer === params.element.connectionID) {
						eqFTP.ftpFunctions.changeDirectory({
							path: path
						});
					}
                    if (eqFTP.globals.globalFtpDetails.main.autoClear == false) {
					   eqFTP.globals.successedQueue.unshift(params.element);
                    }
				}
            } else if (params.status == "downloadComplete") {
				if (params.element) {
					if (params.element.openAfter) {
						if(eqFTP.globals.globalFtpDetails.main.noProjectOnDownload==false) {
							var root = "";
							var localArray = params.element.localPath.split("/");
							var remoteArray = params.element.remotePath.split("/");
							remoteArray.pop();
							remoteArray.reverse();
							localArray.pop();
							localArray.reverse();
							$.each(localArray, function() {
								if (localArray[0] !== undefined && localArray[0].trim() === ""){
									localArray.shift();
								}
								if (remoteArray[0] !== undefined && remoteArray[0].trim() === ""){
									remoteArray.shift();
								}
								if (remoteArray.length < 1) {
									localArray.reverse();
									root = localArray.join("/");
									return false;
								}
								var ratmp = remoteArray.shift();
								if (ratmp === localArray[0]) {
									localArray.shift();
								}
							});
							var currentProjectRoot = ProjectManager.getProjectRoot();
							if (currentProjectRoot._path === root + "/") {
								eqFTP.serviceFunctions.tryOpenFile(params.element.localPath);
							} else {
								var openFolderPromise = ProjectManager.openProject(root);
								openFolderPromise.done(function () {
                                    var tmpInt = setInterval(function() {
                                        eqFTP.serviceFunctions.tryOpenFile(params.element.localPath);
                                        clearInterval(tmpInt);
                                    }, 2000);
								});
								openFolderPromise.fail(function () {
                                    eqFTP.serviceFunctions.customError({
                                        type: "error",
                                        message: params.element.name + ": " + eqFTPstrings.ERR_FOLDER_OPEN
                                    });
                                    var tmpInt = setInterval(function() {
                                        eqFTP.serviceFunctions.tryOpenFile(params.element.localPath);
                                        clearInterval(tmpInt);
                                    }, 2000);
								});
							}
						}else{
							eqFTP.serviceFunctions.tryOpenFile(params.element.localPath+params.element.name);
						}
					}
                    if (eqFTP.globals.globalFtpDetails.main.autoClear == false) {
					   eqFTP.globals.successedQueue.unshift(params.element); 
                    }
				}
            } else if (params.status === "uploadError") {
                eqFTP.globals.failedQueue.unshift(params.element);
            } else if (params.status === "downloadError") {
                params.element.status = eqFTPstrings.ERR_FILE_DOWNLOAD;
                eqFTP.serviceFunctions.customError({
                    type: "error",
                    message: params.element.name + ": " + eqFTPstrings.ERR_FILE_DOWNLOAD
                });
                /*
                if (params.element.status != undefined) {
                    if (params.element.status.code === 550) {
                        params.element.status += " " + eqFTPstrings.ERR_FILE_ACCESSDENIED;
                    }
                } else {
                    params.element.status += " " + eqFTPstrings.ERR_FILE_DOESNTEXIST;
                }
                */
                eqFTP.globals.failedQueue.unshift(params.element);
            } else if (params.status === "downloadFilesize0") {
                params.element.status = eqFTPstrings.ERR_FILE_FILESIZE0;
                eqFTP.globals.failedQueue.unshift(params.element);
            } else if (params.status === "authError") {
                params.element.status = eqFTPstrings.ERR_FILE_AUTHORIZATION;
                eqFTP.globals.failedQueue.unshift(params.element);
            } else if (params.status === "connectError") {
                if (params.err.code === "ENOTFOUND") {
                    params.element.status = eqFTPstrings.ERR_FILE_SERVNOEXIST;
                } else if (params.err.code === "EACCES") {
                    params.element.status = eqFTPstrings.ERR_FILE_SERVCANTREACH;
                } else {
                    params.element.status = eqFTPstrings.OTHER_ERROR + " " + params.err.text;
				}
                eqFTP.globals.failedQueue.unshift(params.element);
            } else if (params.status === "queuePaused") {
                var elements = params.elements;
                var tmp = [];
                $.each(elements, function (i, o) {
                    $.each(eqFTP.globals.processQueue, function(i2, o2) {
						if (o2) {
							if (o2.id !== o.id) {
								//tmp.push(o2);
								eqFTP.globals.processQueue.splice(i2, 1);
							}
						}
                    });
                });
                //eqFTP.globals.processQueue = tmp;
                eqFTP.ftpFunctions.addToQueue(elements);
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
        if (ProjectManager.isWithinProject(document.file.fullPath)) {
            var projectRoot = ProjectManager.getProjectRoot();
            eqFTP.serviceFunctions.getConnectionIDbyPath({
                dontUseCurrent: true,
                path: projectRoot._path,
                callback: function(params) {
                    if (params.connectionID !== false) {
                        var connectionID = params.connectionID;
                        var doUpload = function () {
                            var document = DocumentManager.getCurrentDocument();
                            var name = document.file.name;
                            if (eqFTP.globals.globalFtpDetails.ftp[connectionID].server !== "") {   
                                if (eqFTP.globals.globalFtpDetails.ftp[connectionID].uploadOnSave === true) {
                                    var tmp_queuetype = "automatic";
                                    if (eqFTP.globals.globalFtpDetails.ftp[connectionID].connectToServerEvenIfDisconnected === true || connectionID === eqFTP.globals.connectedServer) {
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
                                }
                            }else{
                                console.log('[eqFTP-test] Everythings ok, except your server field is empty.');
                            }
                        }
                        if (eqFTP.globals.globalFtpDetails.ftp[connectionID] === undefined) {
                            eqFTP.readGlobalRemoteSettings(doUpload);
                        } else {
                            doUpload();
                        }
                    } else {
                        console.log("[eqFTP] Upload on save. There's no connectionID.");
                    }
                }
            });
        } else if (typeof eqFTP.globals.currentDownloadedDocuments[fileid] === "object" && eqFTP.globals.currentDownloadedDocuments[fileid] !== "undefined") {
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
