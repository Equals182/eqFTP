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
 * version 0.7.0
  * Updated Dutch translation.
  * SFTP SUPPORT!
  * ACTUAL SYNC!
  * Added columns' sorting in FileTree Window!
  * FileTree Window now saves dimensions and column widths after Brackets restart!
  * Added Font Awesome for icons instead of svg and png images.
  * Improved dark theme compatibility.
  * Changed behavior of Connection Manager window.
  * Fully rewritten main.js file (should work faster now).
  * Updated Once module and added SCP2 module for SFTP support.
  * Redesigned ftpDomain.js's structure for SFTP support.
  * Improved Brazilian Portuguese translation.
  * Added Ukrainian translation.
  * Added Czech translation.
  * Creating remote files and folders!
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
        NativeApp = brackets.getModule("utils/NativeApp"),
        MainViewManager = brackets.getModule("view/MainViewManager"),
        LanguageManager = brackets.getModule("language/LanguageManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        
        eqFTPstrings = require("strings"),
        eqFTPToolbarTemplate = require("text!htmlContent/eqFTP-toolbar.html"),
        eqFTPModalTemplate = require("text!htmlContent/eqFTP-modal.html"),
        eqFTPPasswordTemplate = require("text!htmlContent/eqFTP-password.html"),
        eqFTPSettingsTemplate = require("text!htmlContent/eqFTP-settings.html"),
        eqFTPQueueTemplate = require("text!htmlContent/eqFTP-queue.html"),
        eqFTPcheckDiffConfirm = require("text!htmlContent/eqFTP-checkDiffConfirm.html"),
        eqFTPConfirmTemplate = require("text!htmlContent/eqFTP-confirm.html"),
        
        eqFTP = {},
        currentQueueTask,
        settingsDialogObject,
        
        defaultUsersDir = brackets.app.getUserDocumentsDirectory(),
        defaultProjectsDir = defaultUsersDir + "/eqFTP Projects",
        settingsFilename = ".remotesettings",
        
		JColResizer = {},
        
        uniqueTreeVar = 0,
        clickedTreeElement = 0,
        tmp_modalClickedItem,
        eventAfterDisconnect = false,
        eventAfterFolderRetrieving = false,
        
        syncLockout = [],
        tmp_connectionID = null,
        cnOffset = 30,
        
        queuePanel = false,
        queuersSelected = [],
        queuersAll = [],
        
        diffChecked = [],
        
        eqftpVersion = "0.7.0";
    
    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    };
    function isJSON(input) {
        try { JSON.parse(input); } catch (e) { return false; }
        return true;
    };
    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift(),
                firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    };
    function eqFTPCheckField(id) {
        var t = $(id),
            tmp = t.val();
        tmp = $.trim(tmp);
        t.removeClass('eqFTP-error');
        if (tmp === "") {
            t.addClass('eqFTP-error');
            eqFTP.sf.notifications.settings({
                type: 'error',
                state: true,
                text: eqFTPstrings.SETTINGSWIND_ERR_BLANKS
            });
            return false;
        }
        return true;
    };
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
    };
    var gldr_int = null;
    var gldr_stack = [];
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
                } else if (this._isFile) {
                    gldr_stack.push(this);
                }
            });
        }
        if (gldr_int !== null) {
            clearInterval(gldr_int);
            gldr_int = null;
        }
        gldr_int = setInterval(function () {
            if (isFunction(callback)) {
                callback(gldr_stack);
            }
            clearInterval(gldr_int);
            gldr_int = null;
        }, 1000);
        return gldr_stack;
    };
    function normalizePath(input) {
        if (input !== undefined) {
            var tmp = input.replace(/\\+/g, '/');
            tmp = tmp.replace(/\/\/+/g, '/');
            return tmp;
        }
        return undefined;
    };
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
    };
    function generateUniqueId(params) {
        if (!params) { params = {}; }
        if (!params.salt) {
            var max = 1000,
                min = 0;
            params.salt = Math.floor(Math.random() * (max - min + 1)) + min;;
        }
        var d = new Date(),
            t = d.getTime(),
            r = "f_" + t + params.salt;
        return r;
    };
    function convertDate(params) {
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
    };
    function shortenFilesize(params) {
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
    };
    function local2remote(localPath) {
        var r = [];
        $.each(eqFTP.globals.projectsPaths, function(i, o) {
            r.push("(^" + o.replace(/\//gi, "\\/") + ")");
        });
        r = new RegExp(r.join("|"));
        return normalizePath("/" + localPath.replace(r, ""));
    };
    function remote2local(params) {
        var root = eqFTP.globals.globalFtpDetails.ftp[params.connectionID].localpath == "" ? normalizePath(eqFTP.globals.globalFtpDetails.main.folderToProjects + "/" + eqFTP.globals.globalFtpDetails.ftp[params.connectionID].connectionName) : eqFTP.globals.globalFtpDetails.ftp[params.connectionID].localpath;
        return normalizePath(root + "/" + params.remotePath);
    }
    function default_cmp(a, b) {
        if (a == b) return 0;
        return a < b ? -1 : 1;
    };
    function getCmpFunc(primer, reverse) {
        var dfc = default_cmp, // closer in scope
            cmp = default_cmp;
        if (primer) {
            cmp = function(a, b) {
                return dfc(primer(a), primer(b));
            };
        }
        if (reverse) {
            return function(a, b) {
                return -1 * cmp(a, b);
            };
        }
        return cmp;
    };
    function sort_by(params) {
        var fields = [],
            n_fields = params.length,
            field, name, reverse, cmp;

        // preprocess sorting options
        for (var i = 0; i < n_fields; i++) {
            field = params[i];
            if (typeof field === 'string') {
                name = field;
                cmp = default_cmp;
                fields.push({
                    name: name,
                    cmp: cmp
                });
            } else if (typeof field === 'object') {
                name = field.name;
                cmp = getCmpFunc(field.primer, field.reverse);
                fields.push({
                    name: name,
                    cmp: cmp
                });
            }
        }

        // final comparison function
        return function(A, B) {
            var a, b, name, result;
            for (var i = 0; i < n_fields; i++) {
                result = 0;
                field = fields[i];
                name = field.name;

                result = field.cmp(A[name], B[name]);
                if (result !== 0) break;
            }
            return result;
        }
    };
    function stringToLower(input) {
        return input.toLowerCase();
    };
    function typeToInt(input) {
        return (input == "folder" ? 0 : 1);
    };
    function getParentFolder(path) {
        if (typeof path === "string")
            return path.replace(/\/[^/]*$/g, "");
        return path;
    };
    function getNameFromPath(path) {
        return normalizePath(path + "/").slice(0, -1).replace(/.*\//gi, "");
    }
    function escapeSlashes(string) {
        return string.replace(/\//g, "\\/");
    };
    function eqFTPdone(mark) {
        if(!mark || mark == 'ok') {
            var icon = 'check',
                color = '#38ea38';
        } else if (mark == 'error') {
            var icon = 'times',
                color = '#d81010';
        }
        var t = setInterval(function() {
            $("#toolbar-eqFTP").html("<i class='fa fa-"+icon+"' style='color: "+color+"'></i>");
            var t2 = setInterval(function() {
                $("#toolbar-eqFTP").html("");
                clearInterval(t2);
            }, 3000);
            clearInterval(t);
        }, 500);
    }
    
    eqFTPSettingsTemplate = Mustache.render(eqFTPSettingsTemplate, eqFTPstrings);
    eqFTPPasswordTemplate = Mustache.render(eqFTPPasswordTemplate, eqFTPstrings);
    eqFTPModalTemplate = Mustache.render(eqFTPModalTemplate, eqFTPstrings);
    eqFTPToolbarTemplate = Mustache.render(eqFTPToolbarTemplate, eqFTPstrings);
    eqFTPQueueTemplate = Mustache.render(eqFTPQueueTemplate, eqFTPstrings);
    eqFTPcheckDiffConfirm = Mustache.render(eqFTPcheckDiffConfirm, eqFTPstrings);
    eqFTPConfirmTemplate = Mustache.render(eqFTPConfirmTemplate, eqFTPstrings);
    FileSystem.getDirectoryForPath(defaultProjectsDir).create();
    
    eqFTP.globals = {
        globalFtpDetails: {
            main: {
                folderToProjects: defaultProjectsDir,
                debug: false
            },
            ftp: []
        },
        remoteStructure: [],
        notifications: true,
        connectedServer: null,
        masterPassword: null,
        defaultSettingsPath: defaultProjectsDir,
        settingsLoaded: false,
        prefs: PreferencesManager.getExtensionPrefs("eqFTP"),
        useEncryption: false,
        ftpLoaded: false,
        fileBrowserResults: "#eqFTPDirectoryListing #eqFTPTable",
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
        modalWindowParams: {
            scrollTop: 0,
            width: 300,
            height: 600,
            allowHiding: true, // Allow hiding modal (this one needs for resizing)
            columns: {
                name: "45%",
                size: "18.3%",
                type: "18.3%",
                modified: "18.3%"
            }
        },
        fileTree: {
            sort: {
                current: [{name: "type", primer: typeToInt, reverse: false}, {name: "name", primer: stringToLower, reverse: false}]
            }
        }
    };
    
    eqFTP.globals.prefs.definePreference("defaultSettingsPathPref", "string", eqFTP.globals.defaultSettingsPath);
    eqFTP.globals.prefs.definePreference("projectsPaths", "array", eqFTP.globals.projectsPaths);
    eqFTP.globals.prefs.definePreference("useEncryption", "boolean", eqFTP.globals.useEncryption);
    eqFTP.globals.prefs.definePreference("notifications", "boolean", eqFTP.globals.notifications);
    eqFTP.globals.prefs.definePreference("modalWindowParams", "object", eqFTP.globals.modalWindowParams);
    
    eqFTP.globals.prefs.on("change", function () {
        eqFTP.globals.defaultSettingsPath = eqFTP.globals.prefs.get("defaultSettingsPathPref") || defaultProjectsDir;
        eqFTP.globals.useEncryption = eqFTP.globals.prefs.get("useEncryption");
        eqFTP.globals.notifications = eqFTP.globals.prefs.get("notifications");
        eqFTP.globals.projectsPaths = eqFTP.globals.prefs.get("projectsPaths") || [];
        eqFTP.globals.modalWindowParams = eqFTP.globals.prefs.get("modalWindowParams") || {
            scrollTop: 0,
            width: 300,
            height: 600,
            allowHiding: true,
            columns: {
                name: "45%",
                size: "18.3%",
                type: "18.3%",
                modified: "18.3%"
            }
        };
    });
    
	/*
	========== jQuery Table Plugin ==========
	*/
    /*ignore jslint start*/
    JColResizer.vars = {
        drag: null,
        tables: [],
        count: 0,
        ID: "id",
        PX: "px",
        SIGNATURE: "JColResizer",
        S: []
    };

    JColResizer.init=function(a,b){
    var c=$(a);if(b.disable)return JColResizer.destroy(c);var d=c.id=c.attr(JColResizer.vars.ID)||JColResizer.vars.SIGNATURE+JColResizer.vars.count++;c.p=b.postbackSafe;c.is("table")&&!JColResizer.vars.tables[d]&&(c.addClass(JColResizer.vars.SIGNATURE).attr(JColResizer.vars.ID,d).before('<div class="JCLRgrips"/>'),c.opt=b,c.g=[],c.c=[],c.w=c.width(),c.gc=c.prev(),b.marginLeft&&c.gc.css("marginLeft",b.marginLeft),b.marginRight&&c.gc.css("marginRight",b.marginRight),c.cs=
    parseInt(JColResizer.vars.ie?a.cellSpacing||a.currentStyle.borderSpacing:c.css("border-spacing"))||2,c.b=parseInt(JColResizer.vars.ie?a.border||a.currentStyle.borderLeftWidth:c.css("border-left-width"))||1,JColResizer.vars.tables[d]=c,JColResizer.createGrips(c))};
    JColResizer.destroy=function(a){

        var b=a.attr(JColResizer.vars.ID);(a=JColResizer.vars.tables[b])&&a.is("table")&&(a.removeClass(JColResizer.vars.SIGNATURE).gc.remove(),delete JColResizer.vars.tables[b])};
    JColResizer.createGrips=function(a){
    var b=a.find(">thead>tr>th,>thead>tr>td");b.length||(b=a.find(">tbody>tr:first>th,>tr:first>th,>tbody>tr:first>td, >tr:first>td"));a.cg=a.find("col");a.ln=b.length;a.p&&S&&S[a.id]&&JColResizer.memento(a,b);b.each(function(b){var d=$(this),e=$(a.gc.append('<div class="JCLRgrip"></div>')[0].lastChild);e.t=a;e.i=b;e.c=d;d.w=d.width();a.g.push(e);a.c.push(d);d.width(d.w).removeAttr("width");b<a.ln-1?e.mousedown(JColResizer.onGripMouseDown).append(a.opt.gripInnerHtml).append('<div class="'+
    JColResizer.vars.SIGNATURE+'" style="cursor:'+a.opt.hoverCursor+'"></div>'):e.addClass("JCLRLastGrip").removeClass("JCLRgrip");e.data(JColResizer.vars.SIGNATURE,{i:b,t:a.attr(JColResizer.vars.ID)})});a.cg.removeAttr("width");JColResizer.syncGrips(a);a.find("td, th").not(b).not("table th, table td").each(function(){$(this).removeAttr("width")})};
    JColResizer.memento=function(a,b){

        var c,d=0,e=0,f=[];if(b)if(a.cg.removeAttr("width"),a.opt.flush)S[a.id]="";else{for(c=JColResizer.vars.S[a.id].split(";");e<a.ln;e++)f.push(100*c[e]/c[a.ln]+"%"),b.eq(e).css("width",f[e]);for(e=0;e<a.ln;e++)a.cg.eq(e).css("width",f[e])}else{JColResizer.vars.S[a.id]="";for(e in a.c)c=a.c[e].width(),JColResizer.vars.S[a.id]+=c+";",d+=c;JColResizer.vars.S[a.id]+=d}};
    JColResizer.syncGrips=function(a){

        a.gc.width(a.w);for(var b=0;b<a.ln;b++){var c=a.c[b];a.g[b].css({left:c.offset().left-a.offset().left+c.outerWidth()+a.cs/2+JColResizer.vars.PX,height:a.opt.headerOnly?a.c[0].outerHeight():a.outerHeight()})}};
    JColResizer.syncCols=function(a,b,c){

        var d=JColResizer.vars.drag.x-JColResizer.vars.drag.l,e=a.c[b],f=a.c[b+1],g=e.w+d,d=f.w-d;e.width(g+JColResizer.vars.PX);f.width(d+JColResizer.vars.PX);a.cg.eq(b).width(g+JColResizer.vars.PX);a.cg.eq(b+1).width(d+JColResizer.vars.PX);c&&(e.w=g,f.w=d)};
    JColResizer.onGripDrag=function(a){
        if(JColResizer.vars.drag){var b=JColResizer.vars.drag.t,c=a.pageX-JColResizer.vars.drag.ox+JColResizer.vars.drag.l,d=b.opt.minWidth,e=JColResizer.vars.drag.i,f=1.5*b.cs+d+b.b,g=e==b.ln-1?b.w-f:b.g[e+1].position().left-b.cs-d,d=e?b.g[e-1].position().left+b.cs+d:f,c=Math.max(d,Math.min(g,c));JColResizer.vars.drag.x=c;JColResizer.vars.drag.css("left",c+JColResizer.vars.PX);b.opt.liveDrag&&(JColResizer.syncCols(b,e),JColResizer.syncGrips(b),c=b.opt.onDrag)&&(a.currentTarget=
    b[0],c(a));return!1}};
    var onGripDragOver=function(a){
        $("body").off("mousemove."+JColResizer.vars.SIGNATURE).off("mouseup."+JColResizer.vars.SIGNATURE);$("head :last-child").remove();if(JColResizer.vars.drag){JColResizer.vars.drag.removeClass(JColResizer.vars.drag.t.opt.draggingClass);var b=JColResizer.vars.drag.t,c=b.opt.onResize;JColResizer.vars.drag.x&&(JColResizer.syncCols(b,JColResizer.vars.drag.i,!0),JColResizer.syncGrips(b),c&&(a.currentTarget=b[0],c(a)));b.p&&JColResizer.vars.S&&JColResizer.memento(b);JColResizer.vars.drag=
    null}};
    JColResizer.onGripMouseDown=function(a){

        var b=$(this).data(JColResizer.vars.SIGNATURE),c=JColResizer.vars.tables[b.t],d=c.g[b.i];d.ox=a.pageX;d.l=d.position().left;$("body").on("mousemove."+JColResizer.vars.SIGNATURE,JColResizer.onGripDrag).on("mouseup."+JColResizer.vars.SIGNATURE,onGripDragOver);d.addClass(c.opt.draggingClass);JColResizer.vars.drag=d;if(c.c[b.i].l)for(a=0;a<c.ln;a++)b=c.c[a],b.l=!1,b.w=b.width();return!1};
    JColResizer.onResize=function(){
        
        for(a in JColResizer.vars.tables){var a=JColResizer.vars.tables[a],b,c=0;a.removeClass(JColResizer.vars.SIGNATURE);if(a.w!=a.width()){a.w=a.width();for(b=0;b<a.ln;b++)c+=a.c[b].w;for(b=0;b<a.ln;b++)a.c[b].css("width",Math.round(1E3*a.c[b].w/c)/10+"%").l=!0}JColResizer.syncGrips(a.addClass(JColResizer.vars.SIGNATURE))}};
    $("body").on("resize."+JColResizer.vars.SIGNATURE,JColResizer.onResize);
    JColResizer.colResizable=function(a,b){

        b=$.extend({draggingClass:"JCLRgripDrag",gripInnerHtml:"",liveDrag:!1,minWidth:15,headerOnly:!1,hoverCursor:"e-resize",dragCursor:"e-resize",postbackSafe:!1,flush:!1,marginLeft:null,marginRight:null,disable:!1,onDrag:null,onResize:null},b);return a.each(function(){JColResizer.init(this,b)})};
    /*ignore jslint end*/ 
	/*
	========== jQuery Table Plugin ==========
	*/
    
    eqFTP.sf = {
        fileTree: {
            add: function() {
                if ($('#detachedModal').length < 1) {
                    $('body').append('<div id="detachedModalHolder" eqFTP-action="modal_hide" style="display: none;"><div id="detachedModal"></div></div>');
                    $('#detachedModal').html(eqFTPModalTemplate);
                    if(eqFTP.globals.modalWindowParams.columns) {
                        $('#detachedModal .eqFTPFileTreeHeader.eqFTPTableNamecol').width(eqFTP.globals.modalWindowParams.columns.name || "45%");
                        $('#detachedModal .eqFTPFileTreeHeader.eqFTPTableSizecol').width(eqFTP.globals.modalWindowParams.columns.size || "18.3%");
                        $('#detachedModal .eqFTPFileTreeHeader.eqFTPTableTypecol').width(eqFTP.globals.modalWindowParams.columns.type || "18.3%");
                        $('#detachedModal .eqFTPFileTreeHeader.eqFTPTableLUcol').width(eqFTP.globals.modalWindowParams.columns.modified || "18.3%");
                    }
                }
            },
            show: function(e) {
                var t = e.target,
                    width = 300,
                    gap = 20,
                    c_x = $("#detachedModalHolder").innerWidth() - $(t).offset().left,
                    c_y = $("#detachedModalHolder").offset().top,
                    r = c_x + gap,
                    t = c_y + gap,
                    maxH = $(window).innerHeight() - 100,
                    maxW = $(window).innerWidth() - 100;

                if (eqFTP.globals.modalWindowParams.height > maxH)
                    eqFTP.globals.modalWindowParams.height = maxH;
                if (eqFTP.globals.modalWindowParams.width > maxW)
                    eqFTP.globals.modalWindowParams.width = maxW;

                $('#detachedModal').css('top', t).css('right', r).css('height', eqFTP.globals.modalWindowParams.height).css('width', eqFTP.globals.modalWindowParams.width);
                $('#detachedModalHolder').show();
                $('#detachedModalHolder>#detachedModal>.modal').css('width', width);
                $('#eqFTPDirectoryListing').css('min-height', 400);
                if (!isNaN(parseInt(eqFTP.globals.connectedServer))) {
                    eqFTP.sf.connections.control({
                        icon: true,
                        status: true
                    });
                }
            },
            sort: {
                set: function(name, sort) {
                    var func = false;
                    if (name == "name")
                        func = stringToLower;
                    else if (name == "size")
                        func = parseInt;
                    else if (name == "lastupdated")
                        func = parseInt;
                    
                    var tmp = [];
                    $.each(eqFTP.globals.fileTree.sort.current, function(i, e) {
                        if(e.name !== "type" && e.name !== name)
                            tmp.push(e);
                    });
                    eqFTP.globals.fileTree.sort.current = tmp;
                    if (sort) {
                        var desc = false;
                        if (sort === "DESC")
                            desc = true;
                        eqFTP.globals.fileTree.sort.current.unshift({name: name, primer: func, reverse: desc});
                    }
                    eqFTP.globals.fileTree.sort.current.unshift({name: "type", primer: typeToInt, reverse: false});
                    eqFTP.sf.remoteStructure.redraw({connectionID: eqFTP.globals.connectedServer});
                }
            }
        },
        serverList: {
            redraw: function() {
                var sc = $('#eqFTP-serverChoosing');
                $(sc).html('');
                $(sc).append('<option disabled selected value="">' +
                             eqFTPstrings.OTHER_SELECT_SERVER_DROPDOWN + 
                             '</option><option disabled>------------------------------</option>');
                var i = 0;
                if (eqFTP.globals.globalFtpDetails.ftp.length > 0) {
                    $.each(eqFTP.globals.globalFtpDetails.ftp, function () {
                        var t = this;
                        $(sc).append('<option value="' + i + '">' + t.connectionName + '</option>');
                        i++;
                    });
                }
                if (!isNaN(parseInt(eqFTP.globals.connectedServer))) {
                    $(sc).find('option').prop('selected', false);
                    $(sc).find('option[value=' + eqFTP.globals.connectedServer + ']').prop('selected', true);
                }
            }
        },
        notifications: {
            settings: function(params) {
                var state = params.state;
                if (state == 0 || state === false) {
                    $('#eqFTP-' + params.type + 'Message').addClass('hide');
                    return true;
                } else {
                    $('#eqFTP-' + params.type + 'Message').removeClass('hide');
                }
                var text = params.text;
                $('#eqFTP-' + params.type + 'Message').text(text);
                var int = setInterval(function() {
                    $('#eqFTP-' + params.type + 'Message').addClass('hide');
                    clearInterval(int);
                }, 3000);
            },
            /**
             * Custom notification in bottom right corner
             * @param {Object} params type: notification || error || warning
             */
            custom: function(params) {
                if (eqFTP.globals.notifications == true) {
                    if (!params.type) {
                        params.type = "notification";
                    }
                    if (!params.connectionName) {
                        params.connectionName = "eqFTP";
                    }
                    /*var offset = 30;
                    $('.eqFTP-customErrorHolder').each(function() {
                        var h = $(this).outerHeight(true);
                    });*/
                    var i = $('.eqFTP-customErrorHolder').length;
                    $("body").append('<div id="eqFTP-customErrorHolder-' + i + '" class="eqFTP-customErrorHolder ' + params.type + '"><div class="text"><strong>' + params.connectionName + ':</strong><br/>' + params.message + '</div><span class="close">&times;</span></div>');
                    var h = $('#eqFTP-customErrorHolder-' + i).outerHeight(true) * -1;
                    $('#eqFTP-customErrorHolder-' + i).css('bottom', h).css('opacity', 0);
                    $('#eqFTP-customErrorHolder-' + i).animate({'bottom': cnOffset, 'opacity': 1}, 100);
                    cnOffset = cnOffset + (-1 * h) + 5;
                    if (isFunction(params.onClick))
                        $("#eqFTP-customErrorHolder-" + i).one("click", params.onClick);
                    var int = setInterval(function() {
                        if ($('#eqFTP-customErrorHolder-' + i).length === 1) {
                            cnOffset = cnOffset + h - 5;
                            var mt = $('#eqFTP-customErrorHolder-' + i).position().top;
                            $('.eqFTP-customErrorHolder').each(function(){
                                if ($(this).not($('#eqFTP-customErrorHolder-' + i)) && $(this).position().top < mt) {
                                    var bh = $(this).parents("body").first().innerHeight();
                                    var t = $(this).position().top;
                                    var eh = $(this).outerHeight(true);
                                    var b = bh - (t + eh);
                                    b = b + h - 5;
                                    $(this).animate({'bottom': b}, 200);                            
                                }
                            });
                            $('#eqFTP-customErrorHolder-' + i).animate({'bottom': h-30, 'opacity': 0}, 50, function() {
                                $('#eqFTP-customErrorHolder-' + i).remove();
                                if (isFunction(params.onDestruct))
                                    params.onDestruct();
                            });
                        }
                        clearInterval(int);
                    }, params.time || 5000);
                }
            }
        },
        windows: {
            settings: {
                open: function(params) {
                    if (params != undefined && params.castWindow) {
                        settingsDialogObject = Dialogs.showModalDialogUsingTemplate(eqFTPSettingsTemplate, false);
                    }
                    $('#eqFTPAllServerList').html('');
                    var i = 0;
                    $('#eqFTPAllServerList').append('<li data-eqFTP-addConnection="'+eqFTP.globals.globalFtpDetails.ftp.length+'" eqFTP-action="settingsWindow_connection_add"><i class="fa fa-plus eqFTP-icon" title="'+eqFTPstrings.SETTINGSWIND_ADDCONN_HOVER+'"></i>'+eqFTPstrings.SETTINGSWIND_ADDCONN_STRING+'<i class="eqFTP-arrow fa fa-chevron-right"></i></li>');
                    if (eqFTP.globals.globalFtpDetails.ftp.length > 0) {
                        $.each(eqFTP.globals.globalFtpDetails.ftp, function() {
                            var t = this;
                            $('#eqFTPAllServerList').append('<li data-eqFTP-openSettings="'+i+'" eqFTP-action="settingsWindow_connection_open"><i data-removeConnection="'+i+'" class="eqFTP-icon fa fa-times eqFTPdeleteConnection" eqFTP-action="settingsWindow_connection_delete" title="'+eqFTPstrings.SETTINGSWIND_DELETECONN_HOVER+'"></i><span>'+t.connectionName+'</span><i class="eqFTP-arrow fa fa-chevron-right"></li>');
                            i++;
                        });
                    }
                    var id = parseInt($('#eqFTP-connectionID').val());
                    if (!isNaN(id)) {
                        $('*[data-eqFTP-opensettings='+id+']').addClass('clicked');
                    }
                    $('#eqFTP-ProjectsFolder').val(eqFTP.globals.globalFtpDetails.main.folderToProjects);
                    $('#eqFTP-noProjectOnDownload').prop('checked', (!!eqFTP.globals.globalFtpDetails.main.noProjectOnDownload));
                    $('#eqFTP-syncLocalProjectWithConnection').prop('checked', (!!eqFTP.globals.globalFtpDetails.main.syncLocalProjectWithConnection));
                    $('#eqFTP-SettingsFolder').val(eqFTP.globals.defaultSettingsPath);
                    $('#eqFTP-debug').prop('checked', ((!!eqFTP.globals.globalFtpDetails.main.debug)));
                    $('#eqFTP-autoClear').prop('checked', (!!eqFTP.globals.globalFtpDetails.main.autoClear));
                    $('#eqFTP-notifications').prop('checked', (!!eqFTP.globals.notifications));
                    $("#eqFTP-timeFormat option[value=" + eqFTP.globals.globalFtpDetails.main.timeFormat + "]").prop('selected', true);
                    $('#eqFTP-useEncryption').prop('checked', eqFTP.globals.useEncryption);
                },
                toMain: function() {
                    $('*[data-eqFTP-openSettings]').removeClass('clicked');
                    $('*[data-eqFTP-addConnection]').removeClass('clicked');
                    $('#eqFTPGlobalSettings').addClass('clicked');
                    $('.eqFTPSettingsHolder').hide();
                    $('#eqFTPGlobalSettingsHolder').show();
                }
            },
            password: {
                get: function(callback) {
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
                }
            },
            checkDiff: {
                get: function(callback) {
                    var dialog = Dialogs.showModalDialogUsingTemplate(eqFTPcheckDiffConfirm, true);
                    dialog.done(function (id) {
                        var request = {
                            connectionID: eqFTP.globals.connectedServer,
                            action: "keep"
                        };
                        if (id !== 'cancel') {
                            request.action = id;
                        }
                        nodeConnection.domains.eqFTP.eqFTPcompareAction(request);
                    });
                    return false;
                }
            },
            /**
             * Asks for confirmation
             * @param   {Object}  params Accept: template (Mustache rendered html), add (function), callback (function)
             * @returns {Boolean} Returns boolean and runs callback with boolean in it
             */
            confirm: function(params) {
                var dialog = Dialogs.showModalDialogUsingTemplate(params.template, true);
                if (isFunction(params.add))
                    params.add();
                dialog.done(function (id) {
                    if (id === 'ok') {
                        if (isFunction(params.callback))
                            params.callback(true);
                        return true;
                    } else if (id === 'close') {
                        if (isFunction(params.callback))
                            params.callback(false);
                        return false;
                    }
                });
                return false;
            }
        },
        files: {
            open: function (path, i) {
                if (eqFTP.globals.globalFtpDetails.main.debug)
                    console.log('[eqFTP] Trying to open file: ' + path);
                var waitASec = setInterval(function() {
                    if (i === undefined) { i = 0; }
                    i++;
                    new FileSystem.resolve(path, function(err, item, stat) {
                        if (!err) {
                            if (stat._size !== 0) {
                                CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: path, paneId: MainViewManager.getActivePaneId()})
                                .done(function() {
                                    i = 10;
                                })
                                .fail(function(err) {
                                    console.error('[eqFTP] Try #' + i + ': failed open file.');
                                });
                            }
                        }
                    });
                    if(i>1) {
                        clearInterval(waitASec);
                    }
                }, 1000);
            }
        },
        directories: {
            getLocal: function(params) {
                var dir = params.directoryObject;
                gldr_stack = [];
                getLocalDirectoryRecursive(dir,function(files){
                    var filesPaths = [];
                    $.each(files,function() {
                        filesPaths.push({
                            localPath: this._path,
                            remotePath: local2remote(this._path),
                            name: this._name,
                            direction: params.direction || "upload",
                            queue: params.queue || "a",
                            type: "file",
                            connectionID: params.connectionID
                        });
                    });
                    if (isFunction(params.callback)) {
                        params.callback(filesPaths);
                    }
                });
            },
            getRemote: function(params) {
                nodeConnection.domains.eqFTP.addToQueue({
                    type: "folderRecursive",
                    connectionID: eqFTP.globals.connectedServer,
                    path: normalizePath(params.path),
                    filesToQueue: params.queue
                });
            }
        },
        queue: {
            saveSizes: function() {
                $.each($(".eqFTPqueueTab:visible:first thead th"), function() {
                    var name = $(this).attr("queueTabname");
                    var width = $(this).width();
                    eqFTP.globals.queueTableParams.widths[name] = width + "px";
                });
            },
            toggle: function() {
                if ($("#eqFTPQueueHolder").is(":visible")) {
                    queuePanel = false;
                    JColResizer.colResizable($("table#eqFTPequeueTable"), {
                        disable: true
                    });
                    Resizer.hide($('#eqFTPQueueHolder'));
                } else {
                    queuePanel = true;
                    Resizer.show($('#eqFTPQueueHolder'));
                    queuePanel = false;
                    JColResizer.colResizable($("table#eqFTPequeueTable"), {
                        liveDrag: true,
                        onResize: function () {
                            eqFTP.sf.queue.saveSizes();
                        }
                    });
                }
            },
            clear: function(params) {
                var keep = false,
                    tmp = [];
                if (params.processQueue) {
                    tmp = [];
                    $.each(eqFTP.globals.processQueue, function(i, o) {
                        if (this!=undefined) {
                            if (this.connectionID == params.connectionID) {
                                if (params.processQueue === "keep")
                                    keep = true;
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
                                if (params.automaticQueue === "keep")
                                    keep = true;
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
            }
        },
        settings: {
            process: function(params, callback) {
                if(eqFTP.globals.useEncryption == true) {
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
                            eqFTP.sf.settings.process(params,callback);
                            callback(false);
                            console.error(err);
                            return false;
                        });
                    }
                    if(eqFTP.globals.masterPassword == null) {
                        var passResult = eqFTP.sf.windows.password.get(function(pass) {
                            if(pass) {
                                params.pass = pass;
                                return doThis(params);
                            }else{
                                eqFTP.globals.globalFtpDetails = {
                                    main: {
                                        folderToProjects: defaultProjectsDir
                                    },
                                    ftp: []
                                };
                                eqFTP.sf.others.ftpLoaded(true);
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
            },
            read: function(callback) {
                if (!eqFTP.globals.settingsLoaded) {
                    var fileEntry = new FileSystem.getFileForPath(normalizePath(eqFTP.globals.defaultSettingsPath + "/" + settingsFilename));
                    if (fileEntry) {
                        var readSettingsPromise = FileUtils.readAsText(fileEntry);
                        readSettingsPromise.done(function (result) {
                            if (result) {
                                eqFTP.sf.settings.process({
                                    text: result,
                                    direction: 'from'
                                }, function(result) {
                                    if (result) {
                                        eqFTP.globals.globalFtpDetails = $.parseJSON(result);
                                        eqFTP.globals.settingsLoaded = true;
                                        $.each(eqFTP.globals.globalFtpDetails.ftp, function(i, e){
                                            if(!e.automatization) {
                                                eqFTP.globals.globalFtpDetails.ftp[i].automatization = {
                                                    type: "classic",
                                                    sync: {
                                                        filecreation: false,
                                                        foldercreation: false,
                                                        fileupdate: false,
                                                        rename: false,
                                                        move: false,
                                                        delete: false,
                                                        checkdiff: false,
                                                        ignore: ""
                                                    },
                                                    classic: {
                                                        uploadOnSave: e.uploadOnSave ? true : false,
                                                        autoConnect: e.connectToServerEvenIfDisconnected ? true : false
                                                    }
                                                };
                                            }
                                        });
                                        nodeConnection.domains.eqFTP.addConnections({
                                            connections: eqFTP.globals.globalFtpDetails.ftp
                                        });
                                        nodeConnection.domains.eqFTP.updateSettings({
                                            debug: eqFTP.globals.globalFtpDetails.main.debug,
                                            defaultLocal: eqFTP.globals.globalFtpDetails.main.folderToProjects
                                        });
                                        eqFTP.sf.others.saveProjectsPaths();
                                        $(".eqFTPQueueCommands label input[name='eqFTP-autoClear']").prop("checked", !!eqFTP.globals.globalFtpDetails.main.autoClear);
                                    } else {
                                        eqFTP.sf.notifications.custom({
                                            type: "error",
                                            message: eqFTPstrings.OTHER_ERROR_CANTREADSETTINGS,
                                        });
                                    }
                                    eqFTP.sf.others.ftpLoaded(true);
                                    if (isFunction(callback))
                                        callback(result);
                                });
                            }
                        });
                        readSettingsPromise.fail(function (err) {
                            eqFTP.sf.settings.write();
                        });
                    }
                } else {
                    if (isFunction(callback))
                        callback(true);
                }
            },
            write: function() {
                var deferred = $.Deferred();
                eqFTP.globals.defaultSettingsPath = normalizePath(eqFTP.globals.defaultSettingsPath);
                var fileEntry = new FileSystem.getFileForPath(eqFTP.globals.defaultSettingsPath + "/" + settingsFilename);
                var ftpData = JSON.stringify(eqFTP.globals.globalFtpDetails);
                eqFTP.sf.settings.process({
                    text: ftpData,
                    direction: 'to'
                },function(result) {
                    if(result) {
                        FileUtils.writeText(fileEntry, result).done(function () {
                            eqFTP.sf.others.saveProjectsPaths();
                            nodeConnection.domains.eqFTP.addConnections({connections:eqFTP.globals.globalFtpDetails.ftp});
                            nodeConnection.domains.eqFTP.updateSettings({debug:eqFTP.globals.globalFtpDetails.main.debug});
                        });
                    }
                });
                eqFTP.sf.remoteStructure.redraw();
                return true;
            }
        },
        connections: {
            getByPath: function(path, callback) {
                eqFTP.sf.settings.read(function(result) {
                    if (result) {
                        var found = false;
                        path = normalizePath(path + "/").replace(/(\/$)/gi, "");
                        $.each(eqFTP.globals.projectsPaths, function(i, o) {
                            var r = new RegExp("^" + normalizePath(o + "/").replace(/\//gi, "\\/"), "gi");
                            if ( r.test(normalizePath(path + "/")) ) {
                                found = true;
                                if (isFunction(callback))
                                    callback(i);
                                return false;
                            }
                        });
                        if(!found)
                            callback(false);
                    }
                });
            },
            control: function(params) {
                if (params.status) {
                    if (params.icon)
                        $('#eqFTPConnectionControl').removeClass('fa-toggle-on fa-toggle-off').addClass('fa-toggle-on');
                    if (!isNaN(parseInt(params.connectedServer)) && params.connectedServer > -1)
                        eqFTP.globals.connectedServer = params.connectedServer;
                    if (params.serverList) {
                        if (!isNaN(parseInt(params.connectedServer)) && params.connectedServer > -1)
                            $("#eqFTP-serverChoosing option[value='" + params.connectedServer + "']").prop("selected", true);
                        else {
                            $("#eqFTP-serverChoosing").val([]);
                            $("#eqFTP-serverChoosing option:first").prop("selected", true);
                        }
                    }
                } else {
                    if (params.icon)
                        $('#eqFTPConnectionControl').removeClass('fa-toggle-on fa-toggle-off').addClass('fa-toggle-off');
                    if (params.table)
                        $('#eqFTPTable').html('');
                    if (params.connectedServer === true)
                        eqFTP.globals.connectedServer = null;
                    if (params.serverList) {
                        $("#eqFTP-serverChoosing").val([]);
                        $("#eqFTP-serverChoosing option:first").prop("selected", true);
                    }
                }
            }
        },
        remoteStructure: {
            add: function(params) {
                if (!isNaN(parseInt(params.connectionID)) && 
                   params.connectionID > -1 && 
                   eqFTP.globals.globalFtpDetails.ftp[params.connectionID] !== undefined)
                {
                    var path = normalizePath(params.path).replace(/(\/$)/gi,'');
                    if (path === "" || path === "'eqFTP'root'")
                        path = "/";
                    var el = {
                            parent: path.substring( 0, path.lastIndexOf( "/" )),
                            contents: params.contents,
                            type: params.element.type || "folder",
                            state: params.element.state || "opened"
                        },
                        draw = [];
                    draw[path] = el;
                    eqFTP.globals.remoteStructure[params.connectionID][path] = el;
                }
                eqFTP.sf.remoteStructure.redraw({
                    connectionID: params.connectionID,
                    draw: draw,
                    element: params.element
                });
            },
            rename: function(params) {
                var parent = normalizePath(getParentFolder(params.pathFrom));
                if (eqFTP.globals.remoteStructure[params.connectionID].hasOwnProperty(parent)) {
                    var item = eqFTP.globals.remoteStructure[params.connectionID][parent];
                    if (item.contents.length > 0) {
                        $.each(item.contents, function(i, e) {
                            if (e.name == params.oldName)
                                eqFTP.globals.remoteStructure[params.connectionID][parent].contents[i].name = params.newName;
                        });
                    }
                }
                var r = new RegExp("^"+escapeSlashes(params.pathFrom), "g");
                for (var path in eqFTP.globals.remoteStructure[params.connectionID]) {
                    if (r.test(path) && eqFTP.globals.remoteStructure[params.connectionID].hasOwnProperty(path)) {
                        var np = path.replace(r, params.pathTo);
                        eqFTP.globals.remoteStructure[params.connectionID][np] = eqFTP.globals.remoteStructure[params.connectionID][path];
                        delete eqFTP.globals.remoteStructure[params.connectionID][path];
                    }
                }
                eqFTP.sf.remoteStructure.redraw({
                    connectionID: params.connectionID
                });
            },
            redraw: function(params) {
                if (!params) params = {};
                if (isNaN(parseInt(params.connectionID)) || params.connectionID < 0) {
                    $("#eqFTPLoading").hide();
                    return false;
                }
                if (!params.draw)
                    params.draw = eqFTP.globals.remoteStructure[params.connectionID] || [];
                
                for (var path in params.draw) {
                    if (params.draw.hasOwnProperty(path)) {
                        params.draw[path].fullPath = path;
                    }
                }
                params.draw.sort(function(a, b) {
                    return a.fullPath.length - b.fullPath.length;
                });

                for (var path in params.draw) {
                    if (params.draw.hasOwnProperty(path)) {
                        var folder = params.draw[path],
                            html = '',
                            state = folder.state || "closed";
                        folder.contents.sort(sort_by(eqFTP.globals.fileTree.sort.current));
                        $.each(folder.contents, function(i, item) {
                            html += '<li class="eqFTPFileTreeRow eqFTP-' + item.type + '" data-bftControl="' + uniqueTreeVar + '" data-path="' + normalizePath(path + "/" + item.name) + '">' +
                                        '<div class="eqFTPFileTreeCell eqFTPTableNamecol"><i class="eqFTPFileTreePlusMinus fa fa-caret-right" eqFTP-action="fileTree_directory_open"></i><i class="eqFTPFileTreePlusMinus fa fa-caret-down" eqFTP-action="fileTree_directory_open"></i><span title="' + item.name + '" class="eqFTPModalItemTitle">' + item.name + '</span></div>' +
                                        '<div class="eqFTPFileTreeCell eqFTPTableSizecol" style="text-align:right;"><span title="' + item.size + '">' + item.sizeShort + '</span></div>' +
                                        '<div class="eqFTPFileTreeCell eqFTPTableTypecol" style="text-align:right;"><span title="' + item.type + '">' + item.type + '</span></div>' +
                                        '<div class="eqFTPFileTreeCell eqFTPTableLUcol" style="text-align:right;"><span title="' + convertDate({input: item.lastupdated, type: 'full'}) + '">' + convertDate({input: item.lastupdatedShort, type: 'short'}) + '</span></div>' + '</li>';
                            uniqueTreeVar++;
                        });
                        if (path == "/") {
                            $('#eqFTPTable').html(html);
                        } else {
                            var parent = $(".eqFTPFileTreeRow[data-path='" + path + "']");
                            if (parent.length === 1) {
                                html = '<ul class="eqFTPFileTreeHolder">' + html + '</ul>';
                                var paths = [];
                                $(parent).children('ul').children('li').children('ul').each(function(i, e) {
                                    paths.push({
                                        path: $(this).parent('.eqFTPFileTreeRow').attr('data-path'),
                                        ul: $(this).clone(true, true)
                                    });
                                    $(this).remove();
                                });
                                $(parent).find('ul').remove();
                                $(parent).append(html).removeClass("opened closed").addClass(state);
                                $.each(paths, function(i, e) {
                                    $(parent).find(".eqFTPFileTreeRow[data-path='" + e.path + "']").append(e.ul);
                                });
                            }
                        }
                    }
                }
                $("#eqFTPLoading").hide();
                if (params.element && params.element.callback && isFunction(eventAfterFolderRetrieving))
                    eventAfterFolderRetrieving();
            }
        },
        others: {
            ftpLoaded: function(e) {
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
                eqFTP.sf.serverList.redraw();
                eqFTP.globals.ftpLoaded = e;
            },
            createContextMenus: function() {
                var eqFTP_modalCmenu_file = Menus.registerContextMenu('equals182-eqftp-file_cmenu');
                eqFTP_modalCmenu_file.addMenuItem("eqftp.downloadFileAndOpen");
                eqFTP_modalCmenu_file.addMenuItem("eqftp.downloadFile");
                eqFTP_modalCmenu_file.addMenuItem("eqftp.addToPausedQueue-d");
                eqFTP_modalCmenu_file.addMenuItem("eqftp.rename");
                eqFTP_modalCmenu_file.addMenuItem("eqftp.delete");
                eqFTP_modalCmenu_file.addMenuDivider();
                eqFTP_modalCmenu_file.addMenuItem("eqftp.createRemoteFile");
                eqFTP_modalCmenu_file.addMenuItem("eqftp.createRemoteFolder");
                $("body").on('contextmenu', ".eqFTP-file", function (e) {
                    tmp_modalClickedItem = $(e.target).hasClass("eqFTPFileTreeRow") ? $(e.target) : $(e.target).closest(".eqFTPFileTreeRow");
                    eqFTP_modalCmenu_file.open(e);
                });

                var eqFTP_modalCmenu_folder = Menus.registerContextMenu('equals182-eqftp-folder_cmenu');
                eqFTP_modalCmenu_folder.addMenuItem("eqftp.downloadFile");
                eqFTP_modalCmenu_folder.addMenuItem("eqftp.addToPausedQueue-d");
                eqFTP_modalCmenu_folder.addMenuItem("eqftp.rename");
                eqFTP_modalCmenu_folder.addMenuItem("eqftp.delete");
                eqFTP_modalCmenu_folder.addMenuDivider();
                eqFTP_modalCmenu_folder.addMenuItem("eqftp.createRemoteFile");
                eqFTP_modalCmenu_folder.addMenuItem("eqftp.createRemoteFolder");
                $("body").on('contextmenu', ".eqFTP-folder", function (e) {
                    tmp_modalClickedItem = $(e.target).hasClass("eqFTPFileTreeRow") ? $(e.target) : $(e.target).closest(".eqFTPFileTreeRow");
                    eqFTP_modalCmenu_folder.open(e);
                });

                var eqFTP_modalCmenu_root = Menus.registerContextMenu('equals182-eqftp-root_cmenu');
                eqFTP_modalCmenu_root.addMenuItem("eqftp.createRemoteFileRoot");
                eqFTP_modalCmenu_root.addMenuItem("eqftp.createRemoteFolderRoot");
                $("body").on('contextmenu', "#eqFTP-project-dialog .modal-body", function (e) {
                    if ($(e.target).closest('.eqFTPListingHeaders').length == 0 && $(e.target).closest('#eqFTPTable').length == 0) {
                        eqFTP_modalCmenu_root.open(e);
                    }
                });

                var eqFTP_queueCmenu = Menus.registerContextMenu('equals182-eqftp-queue_cmenu');
                eqFTP_queueCmenu.addMenuItem("eqftp.queueTaskStart");
                eqFTP_queueCmenu.addMenuItem("eqftp.queueTaskPause");
                eqFTP_queueCmenu.addMenuItem("eqftp.queueTaskRestart");
                eqFTP_queueCmenu.addMenuItem("eqftp.queueTaskRemove");
                $("body").on('contextmenu', "#eqFTPequeueTable tr", function (e) {
                    if (queuersSelected.length < 1 && !$(e.target).hasClass("clicked"))
                        $(e.target).click();
                    eqFTP_queueCmenu.open(e);
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
            addLocalToQueue: function(params) {
                var fileEntry = ProjectManager.getSelectedItem(),
                    localPath = fileEntry._path;
                if (ProjectManager.isWithinProject(localPath)) {
                    var projectRoot = ProjectManager.getProjectRoot();
                    eqFTP.sf.connections.getByPath(projectRoot._path, function(connectionID) {
                        if(!isNaN(parseInt(connectionID)) && connectionID > -1) {
                            var toQueue = [];
                            if (fileEntry.isDirectory) {
                                eqFTP.sf.directories.getLocal({
                                    directoryObject: fileEntry, 
                                    connectionID: connectionID, 
                                    direction: params.direction,
                                    queue: params.queue,
                                    callback: function(filesPaths) {
                                        toQueue = toQueue.concat(filesPaths);
                                        eqFTP.ftp.queue.add(toQueue);
                                    }
                                });
                            } else {
                                var queuer = {
                                    localPath: localPath,
                                    remotePath: local2remote(localPath),
                                    name: fileEntry._name,
                                    direction: params.direction || "upload",
                                    queue: params.queue || "a",
                                    type: "file",
                                    connectionID: connectionID
                                };
                                if (eqFTP.globals.connectedServer !== connectionID)
                                    queuer.after = "disconnect"
                                toQueue.push(queuer);
                                eqFTP.ftp.queue.add(toQueue);
                            }
                        } else {
                            if(eqFTP.globals.globalFtpDetails.main.debug)
                                console.error("[eqFTP] Uploding directory. There's no connectionID.");
                        }
                    });
                }
            },
            saveProjectsPaths: function() {
                var paths = [];
                $.each(eqFTP.globals.globalFtpDetails.ftp, function (i,o) {
                    if (o.localpath && o.localpath !== "")
                        paths[i] = o.localpath;
                    else
                        paths[i] = normalizePath(eqFTP.globals.globalFtpDetails.main.folderToProjects + "/" + o.connectionName + "/");
                });
                eqFTP.globals.prefs.set('projectsPaths', paths);
                eqFTP.globals.prefs.save();
            },
            saveRenames: function() {
                $('.eqFTPModalItemRename').each(function() {
                    var el = $(this);
                    var o = el.attr('data-eqFTPRenameFromName');
                    var n = el.val();
                    var p = el.attr('data-eqFTPRenameFrom');
                    if (o !== n) {
                        n = n.replace(/[^\w|\.|\s]/g, '');
                        var or = o.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                        var re = new RegExp(or+"$");
                        var np = p.replace(re, n);
                        eqFTP.sf.others.syncLockout.add(p);
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
                $("#eqFTPLoading").show();
            },
            createNewFile: function(params) {
                eqFTP.sf.others.syncLockout.add(params.path);
                eqFTP.sf.others.syncLockout.add(remote2local({connectionID: eqFTP.globals.connectedServer, remotePath: params.path}));
                if (params.type === "directory") {
                    nodeConnection.domains.eqFTP.mkd({
                        connectionID: params.connectionID,
                        path: params.path,
                    });
                } else {
                    nodeConnection.domains.eqFTP.mkf({
                        connectionID: params.connectionID,
                        remotePath: params.path,
                        name: getNameFromPath(params.path),
                    });
                }
                $('#eqFTPnewItem').remove();
            },
            syncLockout: {
                add: function(path) {
                    syncLockout.push(path);
                    var i = setInterval(function() {
                        for (var z = 0; z < syncLockout.length; z++) {
                            if (syncLockout[z] === path)
                                delete syncLockout[z];
                        }
                        syncLockout.filter(function(){ return true; });
                        clearInterval(i);
                    }, 3000);
                },
                check: function(path) {
                    return (syncLockout.indexOf(path) < 0) ? false : true;
                }
            }
        }
    }
    eqFTP.ftp = {
        connect: function(params) {
            if (params.connectionID > -1 && params.connectionID != eqFTP.globals.connectedServer) {
                eqFTP.ftp.disconnect({
                    connectionID: eqFTP.globals.connectedServer,
                    callback: function() {
                        eqFTP.globals.modalWindowParams.scrollTop = 0;
                        clickedTreeElement = 0;
                        eqFTP.globals.connectedServer = params.connectionID;
                        if(params.connectionID !== null) {
                            if (eqFTP.globals.remoteStructure[params.connectionID]) {
                                var paths = [],
                                    from = eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer];
                                for (var path in from) {
                                    if (from.hasOwnProperty(path)) {
                                        paths.push(path);
                                    }
                                }
                            } else {
                                var paths = [""];
                            }
                            eqFTP.ftp.changeDirectory({
                                paths: paths,
                                state: 'opened',
                                reload: true
                            });
                            eqFTP.sf.connections.control({
                                icon: true,
                                status: true
                            });
                        }
                    }
                });
            }
        },
        disconnect: function(params) {
            var connectionID = (!isNaN(parseInt(params.connectionID)) && params.connectionID > -1) ? params.connectionID : eqFTP.globals.connectedServer;
            if (!isNaN(parseInt(connectionID)) && parseInt(connectionID) > -1) {
                eventAfterDisconnect = params.callback;
                nodeConnection.domains.eqFTP.disconnect({
                    connectionID: connectionID,
                    clearQueue: true
                });
            } else {
                if (isFunction(params.callback))
                    params.callback();
            }
            return true;
        },
        changeDirectory: function(params) {
            eqFTP.globals.modalWindowParams.scrollTop = $('#eqFTP-project-dialog>.modal-body').scrollTop();
            if (isNaN(parseInt(eqFTP.globals.connectedServer)))
                return false;
            $('#eqFTPLoading').show();
            if (params.paths.length > 0) {
                var toQueue = [];
                $.each(params.paths, function(i, o) {
                    if (!params.state)
                        var state = (eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] && eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer][o])?eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer][o].state:"closed";
                    else if (eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] && eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer][o])
                        eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer][o].state = params.state;
                    
                    if (eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] &&
                        eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer][o] &&
                        !params.reload)
                    {
                        $(".eqFTPFileTreeRow[data-path='" + o + "']").removeClass("opened closed").addClass(params.state);
                        eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer][o].state = params.state;
                    } else {
                        toQueue.push({
                            type: "folder",
                            connectionID: eqFTP.globals.connectedServer,
                            path: o,
                            id: generateUniqueId(),
                            state: state || params.state,
                            callback: params.callback
                        });
                    }
                    if (state) state = undefined;
                });
                if (toQueue.length > 0)
                    eqFTP.ftp.queue.add(toQueue);
                else 
                    $('#eqFTPLoading').hide();
            } else {
                return false;
            }
        },
        queue: {
            add: function(queuers) {
                $.each(queuers, function(i,o) {
                    o.id = generateUniqueId({
                        salt: i
                    });
                    if (o.type === "file")
                        queuersAll.push(o);
                    nodeConnection.domains.eqFTP.addToQueue(o);
                });
            }
        }
    }
    
    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/eqFTP-styles.css");
        ExtensionUtils.loadStyleSheet(module, "styles/font-awesome/css/font-awesome.min.css");
        $("#main-toolbar .buttons").append(eqFTPToolbarTemplate);
        $("#toolbar-eqFTP").on('click', function (e) {
            if (!$(this).hasClass('disabled')) {
                eqFTP.sf.settings.read(function(result) {
                    if (result)
                        eqFTP.sf.fileTree.show(e);
                });
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
                eqFTP.sf.others.ftpLoaded(false);
            });
            loadPromise.done(function (done) {
                console.log("[eqFTP] Loaded (v"+eqftpVersion+")");
                eqFTP.sf.others.ftpLoaded(true);
                eqFTP.sf.fileTree.add();
                //eqFTP.sf.others.createContextMenus(true);
            });
            return loadPromise;
        }
        chain(connectNode, loadNodeFtp);
        
        $(nodeConnection).on("eqFTP:events", function(event, params) {
            if (eqFTP.globals.globalFtpDetails.main.debug)
                console.log(params);
            var e = params.event,
                connectionID = ( (!isNaN(parseInt(params.connectionID)) && params.connectionID > -1) ? params.connectionID : ( (params.element && params.element.connectionID)?params.element.connectionID:false ) ),
                connectionName = (connectionID ? eqFTP.globals.globalFtpDetails.ftp[connectionID].connectionName : "eqFTP");
            if (e === "diff_found")
            {
                NativeApp.openURLInDefaultBrowser(params.path);
            }
            else if (e === "diff_check")
            {
                eqFTP.sf.windows.checkDiff.get();
            }
            else if (e === "diff_compare")
            {
                var panels = MainViewManager.getPaneIdList();
                if (panels.length < 2) {
                    MainViewManager.setLayoutScheme(1,2);
                    panels = MainViewManager.getPaneIdList();
                }
                var lang = LanguageManager.getLanguageForPath(params.local);
                LanguageManager.setLanguageOverrideForPath(params.remote, lang);
                CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: params.local, paneId: panels[0]});
                CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: params.remote, paneId: panels[1]});
            }
            else if (e === "directory_got")
            {
                if(params.err) {
                    eqFTP.sf.remoteStructure.redraw({
                        connectionID: eqFTP.globals.connectedServer
                    });
                    $('#eqFTPLoading').hide();
                }else{
                    var sanitizedFolders = [],
                        sanitizedFiles = [],
                        files = params.files;
                    //Get all files
                    $.each(files, function (index, value) {
                        if (value !== null) {
                            if (value.type === 0) {
                                var sizeShort = shortenFilesize({
                                    input: value.size,
                                    type: "short"
                                });
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

                    if (params.filesToQueue === "a" || params.filesToQueue === "p") {
                        var addToQueue = [];
                        $.each(sanitizedFiles, function() {
                            var item = this;
                            addToQueue.push({
                                connectionID: params.connectionID,
                                name: item.name,
                                remotePath: normalizePath(params.path + "/" + item.name),
                                localPath: remote2local({
                                    remotePath: normalizePath(params.path + "/" + item.name),
                                    connectionID: params.connectionID
                                }),
                                status: false,
                                queue: params.filesToQueue,
                                type: "file",
                                direction: "download"
                            });
                        });
                        eqFTP.ftp.queue.add(addToQueue);
                    }

                    if (!eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer])
                        eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] = [];
                    eqFTP.sf.remoteStructure.add({
                        connectionID: params.connectionID,
                        path: params.path,
                        contents: sanitizedFolders.concat(sanitizedFiles),
                        element: params.queuer
                    });
                    $('#eqFTPLoading').hide();
                }
            }
            else if (e === "directory_delete")
            {
                delete eqFTP.globals.remoteStructure[params.connectionID][normalizePath("/" + params.path)];
                eqFTP.sf.others.syncLockout.add(remote2local({
                    connectionID: params.connectionID,
                    remotePath: params.path + "/"
                }));
                $("[data-path='" + normalizePath("/" + params.path) + "']").remove();
            }
            else if (e === "directory_created")
            {
                eqFTP.ftp.changeDirectory({
                    paths: [normalizePath(getParentFolder(params.path))],
                    reload: true
                });
                var fullpath = "";
                $.each(params.path.split("/"), function(i, val) {
                    if (val && val !== '') {
                        fullpath += "/" + val;
                        eqFTP.sf.others.syncLockout.add(remote2local({connectionID: eqFTP.globals.connectedServer, remotePath: fullpath + "/"}));
                    }
                });
                if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.type === "sync" && eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.sync.foldercreation) {
                    nodeConnection.domains.eqFTP.mkd({
                        connectionID: params.connectionID,
                        local: true,
                        path: remote2local({connectionID: eqFTP.globals.connectedServer, remotePath: params.path})
                    });
                }
            }
            else if (e === "file_created")
            {
                eqFTP.ftp.changeDirectory({
                    paths: [normalizePath(getParentFolder(params.path))],
                    reload: true
                });
                if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.type === "sync" && eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.sync.filecreation) {
                    eqFTP.ftp.queue.add([
                        {
                            remotePath: params.path,
                            localPath: remote2local({
                                connectionID: eqFTP.globals.connectedServer,
                                remotePath: params.path
                            }),
                            name: getNameFromPath(params.path),
                            direction: 'download',
                            queue: 'a',
                            type: "file",
                            connectionID: eqFTP.globals.connectedServer
                        }
                    ]);
                }
            }
            else if (e === "file_rename")
            {
                if (params.err) {
                    eqFTP.sf.notifications.custom({
                        type: "error",
                        message: eqFTPstrings.ERR_FILE_CANTRENAME + params.files.pathFrom,
                        connectionName: connectionName
                    });
                    $("#eqFTPLoading").hide();
                } else {
                    params.files.connectionID = params.connectionID;
                    eqFTP.sf.remoteStructure.rename(params.files);
                    eqFTP.sf.others.syncLockout.add(params.files.pathFrom);
                    eqFTP.sf.others.syncLockout.add(remote2local({connectionID: params.connectionID, remotePath: params.files.pathFrom}));
                    eqFTP.sf.others.syncLockout.add(params.files.pathTo);
                    eqFTP.sf.others.syncLockout.add(remote2local({connectionID: params.connectionID, remotePath: params.files.pathTo}));
                }
            }
            else if (e === "file_delete")
            {
                var p = normalizePath("/" + getParentFolder(params.path));
                eqFTP.sf.others.syncLockout.add(remote2local({
                    connectionID: params.connectionID,
                    remotePath: params.path
                }));
                eqFTP.ftp.changeDirectory({
                    paths: [p],
                    state: (eqFTP.globals.remoteStructure[params.connectionID][p] && eqFTP.globals.remoteStructure[params.connectionID][p].state) ? eqFTP.globals.remoteStructure[params.connectionID][p].state : "closed",
                    reload: true
                });
            }
            else if (e === "files_different")
            {
                eqFTP.sf.notifications.custom({
                    type: "notification",
                    message: eqFTPstrings.NOT_DIAG_FILESDIFFERENT,
                    connectionName: connectionName,
                    onClick: function() {
                        eqFTP.ftp.queue.add([
                            {
                                remotePath: params.remotePath,
                                localPath: params.localPath,
                                name: getNameFromPath(params.localPath),
                                direction: 'download',
                                queue: 'a',
                                type: "file",
                                connectionID: connectionID,
                                after: (eqFTP.globals.connectedServer !== connectionID)?"disconnect":undefined
                            }
                        ]);
                    },
                    onDestruct: function() {
                        nodeConnection.domains.eqFTP.eqFTPcheckDiffDelete(connectionID);
                    }
                })
            }
            else if (e === "server_disconnect")
            {
                eqFTP.globals.connectedServer = false;
                console.log("[eqFTP] Disconnected from server");
                eqFTP.sf.connections.control({
                    status: false,
                    icon: true,
                    connectedServer: true,
                    serverList: true,
                    table: true
                });
                eqFTP.sf.notifications.custom({
                    type: "notification",
                    message: eqFTPstrings.NOT_DIAG_DISCONNECTED,
                    connectionName: connectionName,
                    time: 1000
                });
                if (params.clearQueue)
                    $("[eqFTP-queue-connectionID='" + params.connectionID + "']").remove();
                if (isFunction(eventAfterDisconnect)) {
                    eventAfterDisconnect();
                    eventAfterDisconnect = false;
                }
                $("#eqFTPLoading").hide();
            }
            else if (e === "server_connect")
            {
                eqFTP.sf.notifications.custom({
                    type: "notification",
                    message: eqFTPstrings.NOT_DIAG_CONNECTED,
                    connectionName: connectionName,
                    time: 1000
                });
                eqFTP.sf.connections.control({
                    status: true,
                    icon: true,
                    connectedServer: params.connectionID,
                    serverList: true
                });
                eqFTP.globals.connectedServer = params.connectionID;
                eqFTP.sf.remoteStructure.redraw({
                    connectionID: params.connectionID
                });
                if (eqFTP.globals.globalFtpDetails.main.syncLocalProjectWithConnection) {
                    eqFTP.sf.settings.read(function(result) {
                        if (result) {
                            if (eqFTP.globals.projectsPaths[params.connectionID]) {
                                FileSystem.resolve(eqFTP.globals.projectsPaths[params.connectionID], function(err) {
                                    if (!err && normalizePath(ProjectManager.getProjectRoot()._path + "/") != normalizePath(eqFTP.globals.projectsPaths[params.connectionID] + "/"))
                                        ProjectManager.openProject(eqFTP.globals.projectsPaths[params.connectionID]);
                                });
                            }
                        }
                    });
                }
                console.log("[eqFTP] Connected to server");
            }
            else if (e === "server_connection_error")
            {
                if (params.err.code === "ENOTFOUND") {
                   eqFTP.sf.notifications.custom({
                        type: "error",
                        message: eqFTPstrings.ERR_DIAG_SERVNOEXIST_CONTENT,
                        connectionName: connectionName
                    });
                } else if (params.err.code === "EACCES") {
                    eqFTP.sf.notifications.custom({
                        type: "error",
                        message: eqFTPstrings.ERR_DIAG_SERVCANTREACH_CONTENT
                    });
                } else if (params.err.code === "ECONNRESET") {
                    eqFTP.sf.notifications.custom({
                        type: "error",
                        message: eqFTPstrings.ERR_DIAG_ECONNRESET_CONTENT,
                        connectionName: connectionName
                    });
                } else if (params.err.code === "ECONNABORTED") {
                    eqFTP.sf.notifications.custom({
                        type: "error",
                        message: eqFTPstrings.ERR_DIAG_ECONNABORTED_CONTENT,
                        connectionName: connectionName
                    });
                } else {
                    eqFTP.sf.notifications.custom({
                        type: "error",
                        message: JSON.stringify(params.err)
                    });
                }
            }
            else if (e === "server_auth_error")
            {
                eqFTP.sf.notifications.custom({
                    type: "error",
                    message: eqFTPstrings.ERR_DIAG_AUTHORIZEERR_CONTENT,
                    connectionName: connectionName
                });
            }
            else if (e === "upload_complete")
            {
                eqFTPdone();
                if (params.element.after && params.element.after === "disconnect") {
                    eqFTP.ftp.disconnect({
                        connectionID: params.element.connectionID
                    });
                } else {
                    if (eqFTP.globals.remoteStructure[params.element.connectionID]) {
                        var p = normalizePath("/" + getParentFolder(params.element.remotePath));
                        eqFTP.ftp.changeDirectory({
                            paths: [p],
                            state: (eqFTP.globals.remoteStructure[params.element.connectionID][p] && eqFTP.globals.remoteStructure[params.element.connectionID][p].state) ? eqFTP.globals.remoteStructure[params.element.connectionID][p].state : "closed",
                            reload: true
                        });
                    }
                }
            }
            else if (e === "upload_error")
            {
                eqFTPdone('error');
                eqFTP.sf.notifications.custom({
                    type: "error",
                    message: eqFTPstrings.ERR_FILE_UPLOAD,
                    connectionName: connectionName
                });
                if (params.element.after && params.element.after === "disconnect") {
                    eqFTP.ftp.disconnect({
                        connectionID: params.element.connectionID
                    });
                }
            }
            else if (e === "download_complete")
            {
                eqFTPdone();
                eqFTP.sf.others.syncLockout.add(params.element.localPath_o || params.element.localPath);
                if (params.element.openAfter) {
                    var projectRoot = ProjectManager.getProjectRoot(),
                        currentConnectionProjectPath = eqFTP.globals.projectsPaths[params.element.connectionID];
                    if (projectRoot._path && currentConnectionProjectPath && normalizePath(currentConnectionProjectPath+"/") !== normalizePath(projectRoot._path+"/") && !eqFTP.globals.globalFtpDetails.main.noProjectOnDownload) {
                        var promise = ProjectManager.openProject(currentConnectionProjectPath);
                        promise.done(function() {
                            eqFTP.sf.files.open(params.element.localPath);
                        });
                        promise.fail(function() {
                            eqFTP.sf.notifications.custom({
                                type: "warning",
                                message: eqFTPstrings["ERR_FOLDER_OPEN"] + "<br>" + getParentFolder(params.element.localPath),
                                connectionName: connectionName
                            });
                            eqFTP.sf.files.open(params.element.localPath);
                        });
                    } else {
                        eqFTP.sf.files.open(params.element.localPath);
                    }
                }
                if (params.element.after && params.element.after === "disconnect") {
                    eqFTP.ftp.disconnect({
                        connectionID: params.element.connectionID
                    });
                }
            }
            else if (e === "download_error")
            {
                eqFTPdone('error');
                eqFTP.sf.notifications.custom({
                    type: "error",
                    message: eqFTPstrings.ERR_FILE_DOWNLOAD,
                    connectionName: connectionName
                });
            }
            else if (e === "queue_update")
            {
                if (params.element.type === "file" && !params.element.sync) {
                    var from = params.element.remotePath,
                        to = params.element.localPath;
                    if (params.element.direction === "upload") {
                        from = params.element.localPath;
                        to = params.element.remotePath;
                    }
                    if (params.element.queue !== "d" && !(params.element.queue === "s" && eqFTP.globals.globalFtpDetails.main.autoClear) ) {
                        $("tr[eqFTP-queue-from='" + from + "'][eqFTP-queue-to='" + to + "'][eqFTP-queue-status='" + eqFTPstrings[params.element.status] + "']").remove();
                        var html =  "<tr id='eqFTPqueue_" + params.element.id + "' eqFTP-queue-id='" + params.element.id + "' eqFTP-queue-from='" + escapeHtml(from) + "' eqFTP-queue-to='" + escapeHtml(to) + "' eqFTP-queue-status='" + escapeHtml(eqFTPstrings[params.element.status]) + "' eqFTP-queue-connectionID='" + params.element.connectionID + "' eqFTP-queue-qtype='" + params.element.queue + "' eqFTP-action='queue_item_select'>"+
                                        "<td class='name' width='" + eqFTP.globals.queueTableParams.widths.Name + "'><span title='" + escapeHtml(params.element.name) + "'><span eqFTP-action='queue_item_remove' title='" + escapeHtml(eqFTPstrings.QUEUE_CONTEXTM_REMOVET) + "' class='eqFTP_queue_remove'>&times;</span>" + params.element.name + "</span></td>" +
                                        "<td class='path' width='" + eqFTP.globals.queueTableParams.widths.From + "'><span title='" + escapeHtml(from) + "'>" + from + "</span></td>" +
                                        "<td class='path' width='" + eqFTP.globals.queueTableParams.widths.To + "'><span title='" + escapeHtml(to) + "'>" + to + "</span></td>" +
                                        "<td class='status' width='" + eqFTP.globals.queueTableParams.widths.Status + "'><span title='" + escapeHtml(eqFTPstrings[params.element.status]) + "'>" + eqFTPstrings[params.element.status] + "</span></td>" +
                                    "</tr>";
                        if ($("tr#eqFTPqueue_" + params.element.id).length > 0)
                            $("tr#eqFTPqueue_" + params.element.id).replaceWith(html);
                        else
                            $("#eqFTPequeueTable").children("tbody").append(html);
                        
                        for(var i = 0; i < queuersAll.length; i++) {
                            if (queuersAll[i].id === params.element.id)
                                queuersAll[i] = params.element;
                        }
                        for(var i = 0; i < queuersSelected.length; i++) {
                            if (queuersSelected[i].id === params.element.id)
                                queuersSelected.splice(i, 1);
                        }
                    } else if (params.element.queue === "s" && eqFTP.globals.globalFtpDetails.main.autoClear) {
                        if (params.element.queue === "s" && eqFTP.globals.globalFtpDetails.main.autoClear) {
                            nodeConnection.domains.eqFTP.changeQueue({
                                connectionID: eqFTP.globals.connectedServer,
                                from: "s"
                            });
                        }
                    } else {
                        for(var i = 0; i < queuersAll.length; i++) {
                            if (queuersAll[i].id === params.element.id)
                                queuersAll.splice(i, 1);
                        }
                        for(var i = 0; i < queuersSelected.length; i++) {
                            if (queuersSelected[i].id === params.element.id)
                                queuersSelected.splice(i, 1);
                        }
                        $("tr#eqFTPqueue_" + params.element.id).remove();
                    }
                }
            }
            else if (e === "local_directory_created")
            {
                eqFTP.sf.others.syncLockout.add(params.path + "/");
            }
            else if (e === "error")
            {
                eqFTP.sf.notifications.custom({
                    type: "warning",
                    message: (params.pretext ? eqFTPstrings[params.pretext] + "<br>" : "") + params.text,
                    connectionName: connectionName
                });
            }
            else if (e === "progress")
            {
                var total = params.data.total,
                    done = params.data.transferred,
                    file_id = params.element.id,
                    percent = done / total * 100,
                    tr = $("tr[eqftp-queue-id='" + file_id + "']"),
                    html = '<div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"><span class="sr-only">0%</span></div></div>';
                if (tr.length > 0) {
                    var tdstatus = tr.find("td.status");
                    if (tdstatus.find(".progress").length === 0)
                        tdstatus.prepend(html);
                    if (tdstatus.children("span").length > 0)
                        tdstatus.children("span").remove();
                    var progress = tdstatus.find(".progress-bar"),
                        progressText = progress.find("span");
                    progress.attr("aria-valuenow", percent).css("width", percent + "%");
                    progressText.text(Math.floor(percent) + "%");
                }
            }
            else if (e === "working")
            {
                if (params.work)
                    $("#toolbar-eqFTP").html("<i class='fa fa-circle-o-notch fa-spin'></i>");
                else
                    $("#toolbar-eqFTP").html("");
            }
        });
        
        /*
        * Queue
        */
        
        WorkspaceManager.createBottomPanel("eqFTP.eqFTPQueue", $(eqFTPQueueTemplate), 200);
        StatusBar.addIndicator('eqFTPQueueIndicator', $("<div id='eqFTPQueueIndicator' eqFTP-action='queue_toggle' class='disabled'>"+eqFTPstrings.QUEUE_TITLE+"</div>"), true);
        
        /*
        * Preparing Context Menus' commands
        */
        CommandManager.register(eqFTPstrings.CONTEXTM_DOWNLOAD, "eqftp.downloadFile", function() { 
            var name = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first').text();
            var remotePath = tmp_modalClickedItem.attr('data-path');
            if(tmp_modalClickedItem.hasClass('eqFTP-folder')) {
                // Folder
                eqFTP.sf.directories.getRemote({
                    path: remotePath,
                    queue: 'a'
                });
            }else if(tmp_modalClickedItem.hasClass('eqFTP-file')) {
                // File
                eqFTP.ftp.queue.add([
                    {
                        remotePath: remotePath,
                        localPath: remote2local({
                            connectionID: eqFTP.globals.connectedServer,
                            remotePath: remotePath
                        }),
                        name: name,
                        direction: 'download',
                        queue: 'a',
                        type: "file",
                        connectionID: eqFTP.globals.connectedServer
                    }
                ]);
            }
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_OPEN, "eqftp.downloadFileAndOpen", function() { 
            var name = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first').text(),
                remotePath = tmp_modalClickedItem.attr('data-path');
            eqFTP.ftp.queue.add([
                {
                    remotePath: remotePath,
                    localPath: remote2local({
                        connectionID: eqFTP.globals.connectedServer,
                        remotePath: remotePath
                    }),
                    name: name,
                    direction: 'download',
                    queue: 'a',
                    type: "file",
                    openAfter: true,
                    connectionID: eqFTP.globals.connectedServer
                }
            ]);
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_ADDQUEUE, "eqftp.addToPausedQueue-d", function() {
            var remotePath = tmp_modalClickedItem.attr('data-path');
            var name = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first').text();
            if (tmp_modalClickedItem.hasClass('eqFTP-folder')) {
                // Folder
                eqFTP.sf.directories.getRemote({
                    path: remotePath,
                    queue: 'p'
                });
            } else if (tmp_modalClickedItem.hasClass('eqFTP-file')) {
                // File
                eqFTP.ftp.queue.add([
                    {
                        remotePath: remotePath,
                        localPath: remote2local({
                            connectionID: eqFTP.globals.connectedServer,
                            remotePath: remotePath
                        }),
                        name: name,
                        direction: 'download',
                        queue: 'p',
                        type: "file",
                        connectionID: eqFTP.globals.connectedServer
                    }
                ]);
            }
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_ADDQUEUE, "eqftp.addToPausedQueue-u", function() {
            eqFTP.sf.others.addLocalToQueue({
                queue: 'p',
                direction: 'upload'
            });
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_UPLOAD, "eqftp.addToAutomaticQueue-u", function() {
            eqFTP.sf.others.addLocalToQueue({
                queue: 'a',
                direction: 'upload'
            });
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_RENAME, "eqftp.rename", function() {
            $(".eqFTPModalItemRename").each(function(i, e) {
                $(e).parent().children(".eqFTPModalItemTitle").show();
                $(e).remove();
            });
            var remotePath = tmp_modalClickedItem.attr('data-path');
            var holder = tmp_modalClickedItem.find('.eqFTPModalItemTitle:first');
            var name = holder.text();
            holder.hide();
            tmp_modalClickedItem.children(".eqFTPTableNamecol").append('<input class="eqFTPModalItemRename eqFTPinlineInput" value="' + name + '" data-eqFTPRenameFrom="'+remotePath+'" data-eqFTPRenameFromName="'+name+'">');
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
            eqFTP.sf.windows.confirm({
                template: eqFTPConfirmTemplate,
                add: function() {
                    $("#eqFTPconfirm-textPlaceholder").html(eqFTPstrings.OTHER_CONFIRM_DELETE + "<br/><strong>"+name+"</strong>");
                },
                callback: function(result) {
                    if (result) {
                        if(tmp_modalClickedItem.hasClass('eqFTP-folder')) {
                            // Folder
                            nodeConnection.domains.eqFTP.delete({
                                connectionID: eqFTP.globals.connectedServer,
                                remotePath: normalizePath(remotePath),
                                type: "folder",
                                initial: true
                            });
                        }else if(tmp_modalClickedItem.hasClass('eqFTP-file')) {
                            // File
                            nodeConnection.domains.eqFTP.delete({
                                connectionID: eqFTP.globals.connectedServer,
                                remotePath: normalizePath(remotePath),
                                type: "file"
                            });
                        }
                    }
                }
            });
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_STARTT, "eqftp.queueTaskStart", function() {
            nodeConnection.domains.eqFTP.changeQueue({
                connectionID: eqFTP.globals.connectedServer,
                from: "p",
                to: "a",
                files: queuersSelected
            });
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_PAUSET, "eqftp.queueTaskPause", function() { 
            nodeConnection.domains.eqFTP.changeQueue({
                connectionID: eqFTP.globals.connectedServer,
                from: "a",
                to: "p",
                files: queuersSelected
            });
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_REMOVET, "eqftp.queueTaskRemove", function() {
            nodeConnection.domains.eqFTP.changeQueue({
                connectionID: eqFTP.globals.connectedServer,
                from: ["p", "a", "f", "s"],
                files: queuersSelected
            });
        });
        CommandManager.register(eqFTPstrings.QUEUE_CONTEXTM_RESTARTT, "eqftp.queueTaskRestart", function() {
            nodeConnection.domains.eqFTP.changeQueue({
                connectionID: eqFTP.globals.connectedServer,
                from: "f",
                to: "a",
                files: queuersSelected
            });
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_REDOWNLOAD, "eqftp.redownloadFile", function() {
            eqFTP.sf.others.addLocalToQueue({
                queue: 'a',
                direction: 'download'
            });
        });
        var createNewElement = function(type, root) {
                newItem.type = type;
                var remotePath = (!root)?tmp_modalClickedItem.attr('data-path'):"",
                    action = function(path) {
                        if (!path || path == "") {
                            path = "/";
                            var ul = $('ul#eqFTPTable');
                        } else {
                            var ul = $('[data-path="'+path+'"]').children("ul");
                        }
                        newItem.path = path;
                        if (ul.length > 0) {
                            ul.append("<li id='eqFTPnewItem'><div class='eqFTPFileTreeCell eqFTPTableNamecol'><input class='eqFTPinlineInput' value='Untitled'></div></li>");
                            var t = ul.find('#eqFTPnewItem input');
                            t.focus();
                            var dom = $(t).get(0);
                            dom.selectionStart = 0;
                            dom.selectionEnd = t.val().length;
                        }
                    };
                $('#eqFTPnewItem').remove();
                if (!root) {
                    if (tmp_modalClickedItem.hasClass('eqFTP-folder')) {
                        if (eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer] && eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer][remotePath]) {
                                action(remotePath);
                        } else {
                            eventAfterFolderRetrieving = function() {
                                action(remotePath);
                                eventAfterFolderRetrieving = false;
                            }
                            eqFTP.ftp.changeDirectory({
                                paths: [remotePath],
                                state: "opened",
                                callback: true
                            });
                        }
                    } else if (tmp_modalClickedItem.hasClass('eqFTP-file')) {
                        action(getParentFolder(remotePath));
                    }
                } else {
                    action(remotePath);
                }
            },
            newItem = {
                type: 'file',
                path: false
            };
        CommandManager.register(eqFTPstrings.CONTEXTM_CREATEFILE, "eqftp.createRemoteFile", function() {
            createNewElement("file");
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_CREATEFOLDER, "eqftp.createRemoteFolder", function() {
            createNewElement("directory");
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_CREATEFILE, "eqftp.createRemoteFileRoot", function() {
            createNewElement("file", true);
        });
        CommandManager.register(eqFTPstrings.CONTEXTM_CREATEFOLDER, "eqftp.createRemoteFolderRoot", function() {
            createNewElement("directory", true);
        });
        
        eqFTP.sf.others.createContextMenus();

        $("body").on("change","#eqFTP-serverChoosing",function() {
            var id = parseInt($(this).val());
            if(isNaN(id)) { id = null; }
            eqFTP.ftp.connect({
                connectionID: id
            });
        });
        $("body").on("click", "[eqFTP-action]", function(e) {
            var action = $(this).attr("eqFTP-action");
            if (action === "diff_show")
            {
                nodeConnection.domains.eqFTP.eqFTPcompareAction({
                    connectionID: eqFTP.globals.connectedServer,
                    action: "diff_show"
                });
            }
            else if (action === "modal_hide")
            {
                var t = e.target;
                var p = $(t).parent();
                if ($(p).is("body") && eqFTP.globals.modalWindowParams.allowHiding) {
                    eqFTP.globals.modalWindowParams.scrollTop = $('#eqFTP-project-dialog>.modal-body').scrollTop();
                    $('#detachedModalHolder').hide();
                }
            }
            /**
             * Settings Window events
             */
            else if (action === "settingsWindow_open")
            {
                eqFTP.sf.windows.settings.open({castWindow:true});
            }
            else if (action === "settingsWindow_globalSettings_open")
            {
                eqFTP.sf.windows.settings.toMain();
            }
            else if (action === "settingsWindow_globalSettings_save")
            {
                eqFTP.globals.prefs.set('defaultSettingsPathPref',$('#eqFTP-SettingsFolder').val() || defaultProjectsDir);
                if ($('#eqFTP-useEncryption').is(':checked')) {
                    eqFTP.globals.prefs.set('useEncryption',true);
                } else {
                    eqFTP.globals.masterPassword = null;
                    eqFTP.globals.prefs.set('useEncryption',false);
                }
                eqFTP.globals.prefs.set('notifications',$("#eqFTP-notifications").is(':checked'));
                eqFTP.globals.prefs.save();
                eqFTP.sf.others.saveProjectsPaths();

                eqFTP.globals.globalFtpDetails.main.debug = $("#eqFTP-debug").is(':checked');

                eqFTP.globals.globalFtpDetails.main.timeFormat = $("#eqFTP-timeFormat option:selected").val();
                eqFTP.globals.globalFtpDetails.main.folderToProjects = $("#eqFTP-ProjectsFolder").val();
                eqFTP.globals.globalFtpDetails.main.noProjectOnDownload = $("#eqFTP-noProjectOnDownload").is(':checked');
                eqFTP.globals.globalFtpDetails.main.syncLocalProjectWithConnection = $("#eqFTP-syncLocalProjectWithConnection").is(':checked');

                if(eqFTP.sf.settings.write()) {
                    eqFTP.sf.notifications.settings({
                        type: "notification",
                        state: true,
                        text: eqFTPstrings.SETTINGSWIND_NOTIF_DONE
                    });
                    eqFTP.sf.serverList.redraw();
                } else {
                    eqFTP.sf.notifications.settings({
                        type: "error",
                        state: true,
                        text: eqFTPstrings.SETTINGSWIND_ERR_CANTWRITE
                    });
                }
                nodeConnection.domains.eqFTP.addConnections({connections:eqFTP.globals.globalFtpDetails.ftp});
                nodeConnection.domains.eqFTP.updateSettings({
                    debug: eqFTP.globals.globalFtpDetails.main.debug,
                    defaultLocal: eqFTP.globals.globalFtpDetails.main.folderToProjects
                });
                eqFTP.sf.remoteStructure.redraw({connectionID: eqFTP.globals.connectedServer});
            }
            else if (action === "settingsWindow_connection_save")
            {
                var esh = $(this).closest(".eqFTPSettingsHolder"),
                    id = $(esh).children("[name='eqFTP-connectionID']").val();
                eqFTP.sf.notifications.settings({
                    type: "notification",
                    state: false
                });
                eqFTP.sf.notifications.settings({
                    type: "error",
                    state: false
                });
                if(!isNaN(parseInt(id))) {
                    if( eqFTPCheckField($(esh).find("[name='eqFTP-connectionName']"))==false ||
                        eqFTPCheckField($(esh).find("[name='eqFTP-server']")) == false ||
                        eqFTPCheckField($(esh).find("[name='eqFTP-username']")) == false
                      ){
                        return false;
                    }
                    $(esh).find("input, select").each(function() {
                        $(this).attr("data-eqFTPdefaultValue", $(this).val());
                    });
                    eqFTP.globals.globalFtpDetails.ftp[id] = {
                        connectionName: $(esh).find("[name='eqFTP-connectionName']").val(),
                        server: $(esh).find("[name='eqFTP-server']").val().trim(),
                        port: $(esh).find("[name='eqFTP-serverport']").val(),
                        protocol: $(esh).find("[name='eqFTP-protocol']").val(),
                        username: $(esh).find("[name='eqFTP-username']").val(),
                        password: $(esh).find("[name='eqFTP-password']").val(),
                        localpath: $(esh).find("[name='eqFTP-localroot']").val(),
                        remotepath: $(esh).find("[name='eqFTP-remoteroot']").val(),
                        useList: $(esh).find("[name='eqFTP-useList']").is(':checked'),
                        keepAlive: $(esh).find("[name='eqFTP-keepAlive']").val(),
                        timeOffset: $(esh).find("[name='eqFTP-timeOffset']").val(),
                        RSA: $(esh).find("[name='eqFTP-RSA']").val(),
                        automatization: {
                            type: $(esh).find("[name='eqFTP-automatization']").val(),
                            sync: {
                                filecreation: $(esh).find("[name='eqFTPsync-filecreation']").is(':checked'),
                                foldercreation: $(esh).find("[name='eqFTPsync-foldercreation']").is(':checked'),
                                fileupdate: $(esh).find("[name='eqFTPsync-fileupdate']").is(':checked'),
                                rename: $(esh).find("[name='eqFTPsync-rename']").is(':checked'),
                                delete: $(esh).find("[name='eqFTPsync-delete']").is(':checked'),
                                checkdiff: $(esh).find("[name='eqFTPsync-checkdiff']").is(':checked'),
                                ignore: $(esh).find("[name='eqFTPsync-ignore']").val()
                            },
                            classic: {
                                uploadOnSave: $(esh).find("[name='eqFTP-uploadonsave']").is(':checked'),
                                uploadOnSavePaused: $(esh).find("[name='eqFTP-uploadonsavePaused']").is(':checked'),
                                autoConnect: $(esh).find("[name='eqFTP-autoConnect']").is(':checked')
                            }
                        }
                    };
                    $("[data-eqftp-opensettings="+id+"]").children(".eqFTPchangesAsterisk").remove();
                }

                eqFTP.sf.others.saveProjectsPaths();

                if(eqFTP.sf.settings.write()) {
                    eqFTP.sf.notifications.settings({
                        type: "notification",
                        state: true,
                        text: eqFTPstrings.SETTINGSWIND_NOTIF_DONE
                    });
                    eqFTP.sf.windows.settings.open();
                    $("li[data-eqFTP-openSettings="+id+"] span").click();
                    eqFTP.sf.serverList.redraw();
                } else {
                    eqFTP.sf.notifications.settings({
                        type: "error",
                        state: true,
                        text: eqFTPstrings.SETTINGSWIND_ERR_CANTWRITE
                    });
                }
                nodeConnection.domains.eqFTP.addConnections({connections: eqFTP.globals.globalFtpDetails.ftp});
                nodeConnection.domains.eqFTP.updateSettings({debug: eqFTP.globals.globalFtpDetails.main.debug});
            }
            else if (action === "settingsWindow_connection_open")
            {
                if(!$(this).hasClass('clicked')){
                    $('*[data-eqFTP-openSettings]').removeClass('clicked');
                    $('*[data-eqFTP-addConnection]').removeClass('clicked');

                    $('#eqFTPGlobalSettings').removeClass('clicked');
                    $("#eqFTPGlobalSettingsHolder").hide();

                    $(this).addClass('clicked');
                    $(".eqFTPSettingsHolder").hide();
                    
                    var id = $(this).attr("data-eqFTP-openSettings");
                    if($("#eqFTPSettingsHolder-"+id).length == 0) {
                        $("#eqFTPSettingsHolder").clone().insertBefore($("#eqFTPSettingsHolder")).attr("id", "eqFTPSettingsHolder-"+id).show();
                        $("#btfSettingsWindowsPlaceholder").hide();
                        if(isNaN(parseInt(id))) {
                            eqFTP.sf.windows.settings.toMain();
                            return false;
                        }
                        var setting = eqFTP.globals.globalFtpDetails.ftp[id];
                        
                        $("#eqFTPSettingsHolder-"+id+" .eqFTP_sftpOnly").hide();
                        if (setting.protocol === "sftp")
                            $("#eqFTPSettingsHolder-"+id+" .eqFTP_sftpOnly").show();

                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-connectionID']").val(id);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-connectionName']").val(setting.connectionName).attr("data-eqFTPdefaultValue", setting.connectionName);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-server']").val(setting.server).attr("data-eqFTPdefaultValue", setting.server);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-serverport']").val(setting.port).attr("data-eqFTPdefaultValue", setting.port);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-username']").val(setting.username).attr("data-eqFTPdefaultValue", setting.username);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-password']").val(setting.password).attr("data-eqFTPdefaultValue", setting.password);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-RSA']").val(setting.RSA).attr("data-eqFTPdefaultValue", setting.RSA);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-remoteroot']").val(setting.remotepath).attr("data-eqFTPdefaultValue", setting.remotepath);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-localroot']").val(setting.localpath).attr("data-eqFTPdefaultValue", setting.localpath);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-keepAlive']").val(setting.keepAlive).attr("data-eqFTPdefaultValue", setting.keepAlive);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-timeOffset']").val(setting.timeOffset).attr("data-eqFTPdefaultValue", setting.timeOffset);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-protocol'] option").prop('selected', false);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-protocol'] option[value=" + setting.protocol + "]").prop('selected', true);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-protocol']").attr("data-eqFTPdefaultValue", setting.protocol);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-automatization'] option[value=" + setting.automatization.type + "]").prop('selected', true);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-automatization']").attr("data-eqFTPdefaultValue", setting.automatization.type);

                        $("#eqFTPSettingsHolder-"+id+" .eqFTPauto").hide();
                        $("#eqFTPSettingsHolder-"+id+" .eqFTPauto_"+$("#eqFTPSettingsHolder-"+id+" [name='eqFTP-automatization']").val()).show();
                        $.each(setting.automatization.sync, function(i, e) {
                            if (typeof e === "boolean")
                                $("#eqFTPSettingsHolder-"+id+" [name='eqFTPsync-"+i+"']").prop('checked', e).attr("data-eqFTPdefaultValue", e);
                            else
                                $("#eqFTPSettingsHolder-"+id+" [name='eqFTPsync-"+i+"']").val(e).attr("data-eqFTPdefaultValue", e);
                        });

                        $("span#uploadOnSavePaused").hide();
                        if (setting.automatization.classic.uploadOnSave)
                            $("span#uploadOnSavePaused").show();
                            
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-uploadonsave']").prop("checked", setting.automatization.classic.uploadOnSave).attr("data-eqFTPdefaultValue", setting.automatization.classic.uploadOnSave);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-uploadonsavePaused']").prop("checked", setting.automatization.classic.uploadOnSavePaused).attr("data-eqFTPdefaultValue", setting.automatization.classic.uploadOnSavePaused);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-autoConnect']").prop("checked", setting.automatization.classic.autoConnect).attr("data-eqFTPdefaultValue", setting.automatization.classic.autoConnect);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-useList']").prop("checked", setting.useList).attr("data-eqFTPdefaultValue", setting.useList);
                    } else {
                        $("#eqFTPSettingsHolder-"+id).show();
                    }
                }
            }
            else if (action === "settingsWindow_connection_add")
            {
                if(!$(this).hasClass('clicked')){
                    $("*[data-eqFTP-openSettings]").removeClass('clicked');
                    $("*[data-eqFTP-addConnection]").removeClass('clicked');

                    $("#eqFTPGlobalSettings").removeClass('clicked');
                    $("#eqFTPGlobalSettingsHolder").hide();

                    $(this).addClass('clicked');

                    $(".eqFTPSettingsHolder").hide();
                    var id = $(this).attr("data-eqFTP-addConnection");
                    if($("#eqFTPSettingsHolder-"+id).length == 0) {
                        $("#eqFTPSettingsHolder").clone().insertBefore($("#eqFTPSettingsHolder")).attr("id", "eqFTPSettingsHolder-"+id).show();
                        $("#btfSettingsWindowsPlaceholder").hide();
                        var setting = eqFTP.globals.globalFtpDetails.ftp[id];
                        
                        $("#eqFTPSettingsHolder-"+id+" .eqFTP_sftpOnly").hide();
                        $("span#uploadOnSavePaused").hide();

                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-connectionName']").val("");
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-connectionID']").val(id);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-server']").val("");
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-serverport']").val("21");
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-username']").val("");
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-password']").val("");
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-remoteroot']").val("");
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-localroot']").val("");
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-keepAlive']").val(10);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-timeOffset']").val(0);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-connectToServerEvenIfDisconnected']").prop("checked",false);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-protocol'] option").prop('selected', false);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-protocol'] option[value=FTP]").prop("selected", true);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-uploadonsave']").prop("checked", false);
                        $("#eqFTPSettingsHolder-"+id+" [name='eqFTP-useList']").prop("checked", false);
                    } else {
                        $("#eqFTPSettingsHolder-"+id).show();
                    }
                }
            }
            else if (action === "settingsWindow_connection_delete")
            {
                var id = parseInt($(this).parent().attr('data-eqFTP-openSettings'));
                if (!isNaN(id)) {
                    if (eqFTP.globals.connectedServer !== id) {
                        var r = confirm(eqFTPstrings.SETTINGSWIND_DELETECONNCONF_1 + '"' + eqFTP.globals.globalFtpDetails.ftp[id].connectionName + '"' + eqFTPstrings.SETTINGSWIND_DELETECONNCONF_2);
                        if (r === true) {
                            eqFTP.globals.globalFtpDetails.ftp.splice(id, 1);
                            delete eqFTP.globals.remoteStructure[id];
                            if(eqFTP.sf.settings.write()) {
                                eqFTP.sf.notifications.settings({
                                    type: "notification",
                                    state: true,
                                    text: eqFTPstrings.SETTINGSWIND_NOTIF_DONE
                                });
                                eqFTP.sf.windows.settings.open();
                                eqFTP.sf.windows.settings.toMain();
                                eqFTP.sf.serverList.redraw();
                            } else {
                                eqFTP.sf.notifications.settings({
                                    type: "error",
                                    state: true,
                                    text: eqFTPstrings.SETTINGSWIND_ERR_CANTWRITE
                                });
                            }
                        }
                    } else {
                        eqFTP.sf.notifications.settings({
                            type: "error",
                            state: true,
                            text: eqFTPstrings.SETTINGSWIND_ERROR_DELETE_CURCONNSERV
                        });
                    }
                }
            }
            else if (action === "useDirectoryOpener")
            {
                var t = $(this);
                FileSystem.showOpenDialog(false, true, t.attr('data-eqFTP_ODT'), normalizePath(t.val()), null, function(str, arr){
                    if (arr[0])
                        t.val(arr[0]);
                });
            }
            else if (action === "useFileOpener")
            {
                var t = $(this);
                FileSystem.showOpenDialog(false, false, t.attr('data-eqFTP_ODT'), normalizePath(t.val()), null, function(str, arr){
                    if (arr[0])
                        t.val(arr[0]);
                });
            }
            /**
             * File Tree events
             */
            else if (action === "fileTree_directory_open")
            {
                var li = $(e.target).closest('li')[0],
                    path = $(li).attr("data-path"),
                    state = ($(li).hasClass("opened") ? "closed" : "opened");
                eqFTP.ftp.changeDirectory({
                    paths: [path],
                    state: state
                });
            }
            else if (action === "fileTree_sort")
            {
                if (!$(e.target).is(".resizer")) {
                    var sortby = false;
                    if ($(this).hasClass("eqFTPTableNamecol"))
                        sortby = "name";
                    else if ($(this).hasClass("eqFTPTableSizecol"))
                        sortby = "size";
                    else if ($(this).hasClass("eqFTPTableLUcol"))
                        sortby = "lastupdated";
                    if (sortby) {
                        var now_d = $(this).children(".fa");
                        var next_d = false;
                        if($(now_d).hasClass("fa-sort")) {
                            next_d = "ASC";
                            $(now_d).removeClass("fa-sort fa-sort-asc fa-sort-desc").addClass("fa-sort-asc");
                        }
                        else if ($(now_d).hasClass("fa-sort-asc")) {
                            next_d = "DESC";
                            $(now_d).removeClass("fa-sort fa-sort-asc fa-sort-desc").addClass("fa-sort-desc");
                        }
                        else if ($(now_d).hasClass("fa-sort-desc")) {
                            next_d = false;
                            $(now_d).removeClass("fa-sort fa-sort-asc fa-sort-desc").addClass("fa-sort");
                        }
                        eqFTP.sf.fileTree.sort.set(sortby, next_d);
                    }
                }
            }
            else if (action === "connection_toggle")
            {
                if ($(e.target).hasClass("fa-toggle-on")) {
                    tmp_connectionID = eqFTP.globals.connectedServer;
                    eqFTP.ftp.disconnect({
                        connectionID: eqFTP.globals.connectedServer
                    })
                } else if (!isNaN(parseInt(tmp_connectionID)) && tmp_connectionID > -1) {
                    eqFTP.ftp.connect({
                        connectionID: tmp_connectionID
                    });
                }
            }
            else if (action === "fileTree_refresh")
            {
                if (eqFTP.globals.connectedServer > -1) {
                    var toRefresh = [],
                        from = eqFTP.globals.remoteStructure[eqFTP.globals.connectedServer];
                    for (var path in from) {
                        if (from.hasOwnProperty(path)) {
                            toRefresh.push(path);
                        }
                    }
                    toRefresh.sort(function(a, b) {
                        return a.length - b.length;
                    });
                    eqFTP.ftp.changeDirectory({
                        paths: toRefresh,
                        reload: true
                    })
                }
            }
            else if (action === "settings_reset")
            {
                eqFTP.globals.masterPassword = null;
                eqFTP.globals.settingsLoaded = false;
                eqFTP.sf.settings.read(function(result) {
                    if (result) {
                        eqFTP.sf.notifications.custom({
                            type: "notification",
                            message: eqFTPstrings.SETTINGS_NOTIF_RELOADED
                        });
                    } else {
                        eqFTP.sf.notifications.custom({
                            type: "error",
                            message: eqFTPstrings.SETTINGS_ERROR_RELOADED
                        });
                    }
                });
            }
            /**
            * Queue events
            */
            else if (action === "queue_toggle")
            {
                if(eqFTP.globals.ftpLoaded == true) {
                    eqFTP.sf.queue.toggle();
                }
            }
            else if (action === "queue_start")
            {
                var sids = [];
                $("#eqFTPequeueTable tr[eqftp-queue-connectionid]").each(function() {
                    var id = parseInt($(this).attr("eqftp-queue-connectionid")),
                        ina = $.inArray(id, sids);
                    if(!isNaN(id) && ina == -1)
                        sids.push(id);
                });
                $.each(sids, function(i, o) {
                    nodeConnection.domains.eqFTP.changeQueue({
                        connectionID: o,
                        from: "p",
                        to: "a"
                    });
                });
            }
            else if (action === "queue_pause")
            {
                var sids = [];
                $("#eqFTPequeueTable tr[eqftp-queue-connectionid]").each(function() {
                    var id = parseInt($(this).attr("eqftp-queue-connectionid")),
                        ina = $.inArray(id, sids);
                    if(!isNaN(id) && ina == -1)
                        sids.push(id);
                });
                $.each(sids, function(i, o) {
                    nodeConnection.domains.eqFTP.changeQueue({
                        connectionID: o,
                        from: "a",
                        to: "p"
                    });
                });
            }
            else if (action === "queue_clear")
            {
                var sids = [];
                $("#eqFTPequeueTable tr[eqftp-queue-connectionid]").each(function() {
                    var id = parseInt($(this).attr("eqftp-queue-connectionid")),
                        ina = $.inArray(id, sids);
                    if(!isNaN(id) && ina == -1)
                        sids.push(id);
                });
                $.each(sids, function(i, o) {
                    nodeConnection.domains.eqFTP.changeQueue({
                        connectionID: o,
                        from: ["p", "a", "f", "s"]
                    });
                });
            }
            else if (action === "queue_restart")
            {
                var sids = [];
                $("#eqFTPequeueTable tr[eqftp-queue-connectionid]").each(function() {
                    var id = parseInt($(this).attr("eqftp-queue-connectionid")),
                        ina = $.inArray(id, sids);
                    if(!isNaN(id) && ina == -1)
                        sids.push(id);
                });
                $.each(sids, function(i, o) {
                    nodeConnection.domains.eqFTP.changeQueue({
                        connectionID: o,
                        from: "f",
                        to: "a"
                    });
                });
            }
            else if (action === "queue_item_select")
            {
                var tr = $(this);
                if ($(tr).is("[eqFTP-action='queue_item_remove']"))
                    return false;
                if (!$(tr).is("tr"))
                    tr = tr.closest("tr");
                var id = $(tr).attr("eqFTP-queue-id");
                $(tr).toggleClass("clicked");
                if ($(tr).hasClass("clicked")) {
                    var f = false;
                    for(var i = 0; i < queuersAll.length; i++) {
                        if (queuersAll[i].id === id) {
                            if (f)
                                queuersAll.splice(i, 1);
                            else
                                f = queuersAll[i];
                        }
                    }
                    if (f)
                        queuersSelected.push(f);
                } else {
                    for(var i = 0; i < queuersSelected.length; i++) {
                        if (queuersSelected[i].id === id) {
                            queuersSelected.splice(i, 1);
                        }
                    }
                }
            }
            else if (action === "queue_item_remove")
            {
                var tr = $(e.target).closest("tr"),
                    id = $(tr).attr("eqFTP-queue-id"),
                    f = false;
                for(var i = 0; i < queuersAll.length; i++) {
                    if (queuersAll[i].id === id) {
                        if (f)
                            queuersAll.splice(i, 1);
                        else
                            f = queuersAll[i];
                    }
                }
                nodeConnection.domains.eqFTP.changeQueue({
                    connectionID: eqFTP.globals.connectedServer,
                    from: ["p", "a", "f", "s"],
                    files: [f]
                });
            }
        });
        $("body").on("keyup", ".eqFTPModalItemRename", function(e) {
            var code = e.keyCode || e.which;
            if (code == 13) {
                eqFTP.sf.others.saveRenames();
            } else if (code == 27) {
                $(this).parent().children(".eqFTPModalItemTitle").show();
                $(this).remove();
            }
        });
        $("body").on("click", "#detachedModalHolder", function(e) {
            var t = e.target;
            if (!$(t).hasClass("eqFTPModalItemRename")) {
                $(".eqFTPModalItemRename").each(function(i, e) {
                    $(e).parent().children(".eqFTPModalItemTitle").show();
                    $(e).remove();
                });
            }
            if (!$(t).is("#eqFTPnewItem input")) {
                $("#eqFTPnewItem").remove();
            }
        });
        $("body").on("change", "[name='eqFTP-autoClear']", function() {
            eqFTP.globals.globalFtpDetails.main.autoClear = $("[name='eqFTP-autoClear']").is(':checked');
            eqFTP.sf.settings.write();
        });
        $("body").on("change", "[name='eqFTP-protocol']", function() {
            var type = $(this).val(),
                p = $(this).closest(".eqFTPconnectionSettings"),
                port = p.find("[name='eqFTP-serverport']"),
                changed = $(port).attr("data-eqFTPportChanged");
            if (type === "ftp") {
                if (changed == "false")
                    $(port).val("21");
                $(p).find(".eqFTP_sftpOnly").hide();
            } else if (type === "sftp") {
                if (changed == "false")
                    $(port).val("22");
                $(p).find(".eqFTP_sftpOnly").show();
            }
        });
        $("body").on("change", "[name='eqFTP-serverport']", function() {
            $(this).attr("data-eqFTPportChanged", "true");
        });
        $("body").on("change", "[name='eqFTP-uploadonsave']", function() {
            if ($(this).is(":checked")) {
                $("span#uploadOnSavePaused").show();
            } else {
                $("span#uploadOnSavePaused").hide();
            }
        });
        $("body").on("keyup", "#eqFTPnewItem input", function(e) {
            var code = e.keyCode || e.which,
                val = $(this).val().replace(/[^\w|\.|\s]/g, '');
            if (code == 13) {
                eqFTP.sf.others.createNewFile({
                    connectionID: eqFTP.globals.connectedServer,
                    path: normalizePath(newItem.path + "/" + val),
                    type: newItem.type
                });
            } else if (code == 27) {
                $('#eqFTPnewItem').remove();
            }
        });

        /**
         * Settings Window events
         */
        $("body").on("click", "[data-eqFTPSwitchTabTo]", function() {
            var t = $(this).attr("data-eqFTPSwitchTabTo"),
                g = $(this).attr("data-eqFTPTargetTabGroup"),
                l = $(this).attr("data-eqFTPinLimits");
            if ($(l).length === 0)
                l = "body";
            $(this).closest(l).find("[data-eqFTPTargetTabGroup='"+g+"']").removeClass("current");
            $(this).addClass("current");
            $(this).closest(l).find("[data-eqFTPTabGroup='"+g+"']").hide();
            $(this).closest(l).find(t+"[data-eqFTPTabGroup='"+g+"']").show();
        });
        $("body").on("change", "[name='eqFTP-automatization']", function() {
            var v = $(this).val(),
                as = $(this).closest(".eqFTPautomatizationSettings");
            $(as).find(".eqFTPauto").hide();
            $(as).find(".eqFTPauto_"+v).show();
        })
        $("body").on("keyup change", ".eqFTPSettingsHolder input, .eqFTPSettingsHolder select", function() {
            var id = $(this).closest('.eqFTPSettingsHolder').children("[name='eqFTP-connectionID']").val();
            $("[data-eqftp-opensettings="+id+"]").children(".eqFTPchangesAsterisk").remove();
            if ($(this).attr("data-eqFTPdefaultValue") != $(this).val()) {
                $("[data-eqftp-opensettings="+id+"]").children("span").after("<span class='eqFTPchangesAsterisk'> (*)</span>");
            }
        });
        $("body").on("click", "#eqFTP-project-settings [data-button-id='close']", function() {
            if ($("#eqFTP-project-settings").find(".eqFTPchangesAsterisk").length > 0) {
                eqFTP.sf.windows.confirm({
                    template: eqFTPConfirmTemplate,
                    add: function() {
                        $("#eqFTPconfirm-textPlaceholder").html(eqFTPstrings.OTHER_CONFIRM_SETTINGSCLOSE);
                    },
                    callback: function(result) {
                        if (result) {
                            settingsDialogObject.close();
                        }
                    }
                });
            } else {
                settingsDialogObject.close();
            }
        });

        /**
         * File Tree events
         */
        $("body").on('dblclick', ".eqFTP-folder", function (e) {
            var li = $(e.target).closest('li'),
                tli = $(this).closest('li');
            if ($(tli).is($(li)) && $(li).hasClass("eqFTP-folder")) {
                if (!$(li).hasClass('eqFTPModalItemRename')) {
                    var path = $(li).attr("data-path"),
                        state = ($(li).hasClass("opened") ? "closed" : "opened");
                    eqFTP.ftp.changeDirectory({
                        paths: [path],
                        state: state
                    });
                }
            }
        });
        $("body").on('dblclick', ".eqFTP-file", function (e) {
            var t = e.target;
            if (!$(t).hasClass('eqFTPModalItemRename')) {
                var name = $(this).find('.eqFTPModalItemTitle:first').text();
                eqFTP.ftp.queue.add([
                    {
                        remotePath: $(this).attr("data-path"),
                        localPath: remote2local({
                            connectionID: eqFTP.globals.connectedServer,
                            remotePath: $(this).attr("data-path")
                        }),
                        name: name,
                        direction: 'download',
                        queue: 'a',
                        type: "file",
                        openAfter: true,
                        connectionID: eqFTP.globals.connectedServer
                    }
                ]);
            }
        });
        $("body").on("mousewheel", "#eqFTP-project-dialog>.modal-body", function() {
            eqFTP.globals.modalWindowParams.scrollTop = $('#eqFTP-project-dialog>.modal-body').scrollTop();
        });
        $("body").on("mousedown", "#eqFTP-dmhandle", function (e) {
            e.preventDefault();
            var ox = e.pageX,
                oy = e.pageY,
                p = $(this).parents("#detachedModal:first"),
                ph = $(p).innerHeight(),
                pw = $(p).innerWidth();
            eqFTP.globals.modalWindowParams.allowHiding = false;
            $("body").on("mousemove", "#detachedModalHolder", function(e) {
                var x = e.pageX,
                    y = e.pageY,
                    dx = x - ox,
                    dy = y - oy;
                $(p).height(ph + dy).width(pw - dx);
            });
        });
        $("body").on("mouseup", function() {
            if (!eqFTP.globals.modalWindowParams.allowHiding) {
                $("body").off("mousemove", "#detachedModal");
                $("body").off("mousemove", "#detachedModalHolder");
                if ($("#detachedModal").is(":visible")) {
                    eqFTP.globals.modalWindowParams.height = $("#detachedModal").innerHeight();
                    eqFTP.globals.modalWindowParams.width = $("#detachedModal").innerWidth();
                    var tw = $("#detachedModal .header").width();
                    eqFTP.globals.modalWindowParams.columns = {
                        name: ($("#detachedModal .eqFTPFileTreeHeader.eqFTPTableNamecol").width() / tw * 100) + "%",
                        size: ($("#detachedModal .eqFTPFileTreeHeader.eqFTPTableSizecol").width() / tw * 100) + "%",
                        type: ($("#detachedModal .eqFTPFileTreeHeader.eqFTPTableTypecol").width() / tw * 100) + "%",
                        modified: ($("#detachedModal .eqFTPFileTreeHeader.eqFTPTableLUcol").width() / tw * 100) + "%",
                    };
                }
                var i = setInterval(function() {
                    eqFTP.globals.modalWindowParams.allowHiding = true;
                    eqFTP.globals.prefs.set('modalWindowParams',eqFTP.globals.modalWindowParams);
                    clearInterval(i);
                }, 100);
            }
        });
        $("body").on("mousedown", ".eqFTPFileTreeHeader .resizer", function(e) {
            e.preventDefault();
            eqFTP.globals.modalWindowParams.allowHiding = false;
            var ox = e.pageX,
                p = $(this).closest(".eqFTPFileTreeHeader"),
                pw = $(p).innerWidth(),
                t = $(this).closest(".eqFTPFileTreeHolder"),
                tw = $(t).innerWidth(),
                n = $(p).next(),
                nw = $(n).innerWidth(),
                pc = false,
                nc = false;
            if ($(p).hasClass("eqFTPTableNamecol"))
                pc = ".eqFTPTableNamecol";
            else if ($(p).hasClass("eqFTPTableSizecol"))
                pc = ".eqFTPTableSizecol";
            else if ($(p).hasClass("eqFTPTableTypecol"))
                pc = ".eqFTPTableTypecol";
            else if ($(p).hasClass("eqFTPTableLUcol"))
                pc = ".eqFTPTableLUcol";

            if ($(n).hasClass("eqFTPTableNamecol"))
                nc = ".eqFTPTableNamecol";
            else if ($(n).hasClass("eqFTPTableSizecol"))
                nc = ".eqFTPTableSizecol";
            else if ($(n).hasClass("eqFTPTableTypecol"))
                nc = ".eqFTPTableTypecol";
            else if ($(n).hasClass("eqFTPTableLUcol"))
                nc = ".eqFTPTableLUcol";
            if (pc && nc) {
                $("body").on("mousemove", "#detachedModal", function(e) {
                    var x = e.pageX,
                        dx = x - ox,
                        pwnp = (pw + dx)/tw*100,
                        nwnp = (nw - dx)/tw*100;
                    if(pwnp>5 && nwnp>5) {
                        $(pc).width(pwnp+"%");
                        $(nc).width(nwnp+"%");
                    }
                });
            }
        });
        
        $(DocumentManager).on("documentSaved", function (event, doc) {
            var document = DocumentManager.getCurrentDocument();
            if (ProjectManager.isWithinProject(document.file.fullPath)) {
                var projectRoot = ProjectManager.getProjectRoot();
                eqFTP.sf.connections.getByPath(projectRoot._path, function(connectionID) {
                    if (!isNaN(parseInt(connectionID)) && connectionID > -1) {
                        if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.type === "classic") {
                            if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.classic.uploadOnSave === true 
                                && (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.classic.autoConnect || eqFTP.globals.connectedServer === connectionID) )
                            {
                                var queue = "a";
                                if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.classic.uploadOnSavePaused)
                                    queue = "p";
                                var queuer = {
                                    localPath: document.file.fullPath,
                                    remotePath: local2remote(document.file.fullPath),
                                    name: document.file.name,
                                    direction: "upload",
                                    queue: queue,
                                    type: "file",
                                    connectionID: connectionID
                                };
                                if (eqFTP.globals.connectedServer !== connectionID)
                                    queuer.after = "disconnect"
                                eqFTP.ftp.queue.add([queuer]);
                            }
                        }
                    }
                });
            }
        });
        $(ProjectManager).on("projectOpen", function(event, proj) {
            if (eqFTP.globals.globalFtpDetails.main.syncLocalProjectWithConnection) {
                if (eqFTP.globals.connectedServer > -1 && eqFTP.globals.projectsPaths[eqFTP.globals.connectedServer] !== proj._path) {
                    eqFTP.sf.connections.getByPath(proj._path, function(connectionID) {
                        if (!isNaN(parseInt(connectionID)) && connectionID > -1 && connectionID != parseInt($("#eqFTP-serverChoosing").val())) {
                            eqFTP.ftp.connect({
                                connectionID: connectionID
                            });
                        }
                    });
                }
            }
        });
        FileSystem.on("change", function(event, entry, created, deleted) {
            if (entry) {
                if (ProjectManager.isWithinProject(entry._path)) {
                    var projectRoot = ProjectManager.getProjectRoot();
                    eqFTP.sf.connections.getByPath(projectRoot._path, function(connectionID) {
                        if (!isNaN(parseInt(connectionID)) && connectionID > -1) {
                            if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.type === "sync") {
                                if (entry._isFile && !eqFTP.sf.others.syncLockout.check(entry._path)) {
                                    if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.sync.fileupdate) {
                                        var queuer = {
                                            localPath: entry._path,
                                            remotePath: local2remote(entry._path),
                                            name: entry._name,
                                            direction: "upload",
                                            sync: true,
                                            queue: "a",
                                            type: "file",
                                            connectionID: connectionID
                                        };
                                        if (eqFTP.globals.connectedServer !== connectionID)
                                            queuer.after = "disconnect";
                                        eqFTP.ftp.queue.add([queuer]);
                                    }
                                } else if (entry._isDirectory) {
                                    if (created && created.length > 0) {
                                        for (var i = 0; i < created.length; i++) {
                                            console.log("TEEST", syncLockout, created[i]._path);
                                            if (!eqFTP.sf.others.syncLockout.check(created[i]._path)) {
                                                if (created[i]._isFile && eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.sync.filecreation) {
                                                    var queuer = {
                                                        localPath: created[i]._path,
                                                        remotePath: local2remote(created[i]._path),
                                                        name: created[i]._name,
                                                        direction: "upload",
                                                        sync: true,
                                                        queue: "a",
                                                        type: "file",
                                                        connectionID: connectionID
                                                    };
                                                    if (eqFTP.globals.connectedServer !== connectionID)
                                                        queuer.after = "disconnect";
                                                    eqFTP.ftp.queue.add([queuer]);
                                                } else if (created[i]._isDirectory && eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.sync.foldercreation) {
                                                    nodeConnection.domains.eqFTP.mkd({
                                                        connectionID: connectionID,
                                                        path: local2remote(created[i]._path)
                                                    });
                                                }
                                            }
                                        }
                                    }
                                    if (deleted && deleted.length > 0 && eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.sync.delete) {
                                        for (var i = 0; i < deleted.length; i++) {
                                            if (!eqFTP.sf.others.syncLockout.check(deleted[i]._path)) {
                                                if (deleted[i]._isFile) {
                                                    nodeConnection.domains.eqFTP.delete({
                                                        connectionID: eqFTP.globals.connectedServer,
                                                        path: normalizePath(local2remote(deleted[i]._path)),
                                                        type: "file",
                                                        sync: true
                                                    });
                                                } else if (deleted[i]._isDirectory) {
                                                    nodeConnection.domains.eqFTP.delete({
                                                        connectionID: eqFTP.globals.connectedServer,
                                                        remotePath: normalizePath(local2remote(deleted[i]._path)),
                                                        type: "folder",
                                                        initial: true,
                                                        sync: true
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
        });
        FileSystem.on("rename", function(event, from, to) {
            eqFTP.sf.connections.getByPath(from, function(connectionID) {
                if (!isNaN(parseInt(connectionID)) && connectionID > -1) {
                    if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.type === "sync" && eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.sync.rename) {
                        if (!eqFTP.sf.others.syncLockout.check(from)) {
                            nodeConnection.domains.eqFTP.rename({
                                connectionID: connectionID,
                                from: local2remote(from),
                                to: local2remote(to),
                                oldName: getNameFromPath(from),
                                newName: getNameFromPath(to),
                                sync: true
                            });
                        }
                    }
                }
            });
        });
        $(EditorManager).on("activeEditorChange", function(e, gain, loose) {
            if (eqFTP.globals.ftpLoaded && gain) {
                var currentFile = gain.document.file._path;
                eqFTP.sf.connections.getByPath(currentFile, function(connectionID) {
                    if (!isNaN(parseInt(connectionID)) && connectionID > -1) {
                        if (eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.type === "sync" && eqFTP.globals.globalFtpDetails.ftp[connectionID].automatization.sync.checkdiff) {
                            nodeConnection.domains.eqFTP.eqFTPcheckDiff({
                                connectionID: connectionID,
                                remotePath: local2remote(currentFile),
                                after: (eqFTP.globals.connectedServer != connectionID)?"disconnect":undefined
                            });
                        }
                    }
                });
            }
        });
    });
});