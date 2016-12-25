var strings = {
  "eqftp__toolbar__title" : "Open eqFTP Panel",

  "eqftp__context__upload": "Upload",

  /**
  * CONNECTION'S SETTINGS WINDOW
  */
  "eqftp__cs__window_title": "Edit connection",
  "eqftp__cs__basic_settings": "Basic settings",
  "eqftp__cs__additional_settings": "Additional settings",
  "eqftp__cs__c_name": "Connection name",
  "eqftp__cs__c_protocol": "Protocol",
  "eqftp__cs__c_server": "IP address or domain name",
  "eqftp__cs__c_port": "Port",
  "eqftp__cs__c_login": "Login",
  "eqftp__cs__c_password": "Password",
  "eqftp__cs__c_localpath": "Local path",
  "eqftp__cs__c_remotepath": "Remote path",
  "eqftp__cs__c_check_difference": "Check difference between files",
  "eqftp__cs__c_autoupload": "Automatically upload changes",
  "eqftp__cs__c_ignore_list": "Ignore list",
  "eqftp__cs__c_ignore_list_placeholder": "Use .gitignore syntax",

  /**
  * LOGS
  */
  "eqftp__log__download_success": "File {{filename}} successfuly downloaded",
  "eqftp__log__download_error": "There was an error downloading {{filename}}: {{err}}",
  "eqftp__log__upload_success": "File {{filename}} successfuly uploaded",
  "eqftp__log__upload_error": "There was an error uploading {{filename}}: {{err}}",

  "eqftp__log__connection_ready": "Connection {{name}} opened",
  "eqftp__log__connection_error": "There was an error on {{name}} connection: {{error}}",
  "eqftp__log__connection_close": "Connection {{name}} closed",
  "eqftp__log__connection_tmp_error": "Can't create temporary connection: {{error}}",

  "eqftp__log__settings_load_success": "Settings file {{filename}} loaded",
  "eqftp__log__settings_load_error": "There was an error loading settings file {{filename}}",

  /**
  * CONTROLS
  */
  "eqftp__controls__save": "Save",
  "eqftp__controls__delete": "Delete",
  "eqftp__controls__cancel": "Cancel",

  /**
  * FILESIZES
  */
  "eqftp__filesize_bytes" : "bytes",
  "eqftp__filesize_kilobytes" : "kb",
  "eqftp__filesize_megabytes" : "mb",
  "eqftp__filesize_gigabytes" : "gb",
  "eqftp__filesize_terabytes" : "tb",
  "eqftp__filesize_petabytes" : "pt",
  "eqftp__filesize_exabytes" : "eb",
  "eqftp__filesize_zettabytes" : "zb",
  "eqftp__filesize_yottabytes" : "yb",

  "eqftp_dummy" : "dummy" // Not used anywhere, just leave it.
};

var tpls = {};
$.ajaxSetup({
  async: false
});
['connectionElement', 'dropdownElement', 'fileTreeElement-file', 'fileTreeElement-folder', 'panel', 'queueElement', 'logElement', 'menuElement', 'toastElement'].forEach(function (tpl) {
  $.get('htmlContent/' + tpl + '.html', function (t, status, resp) {
    tpls[tpl] = function (params) {
      return $(Mustache.render(resp.responseText, ($.extend(strings, (params || {})))));
    };
  });
});
var elements = {
  panel: '.eqftp',
  dropdown: '.eqftp-header__dropdown',
  dropdownElementholder: '.eqftp-header__dropdownList',
  connectionsElementholder: '.eqftp-connections',
  fileTreeElementholder: '.eqftp-fileTree',
  logElementholder: '.eqftp-footer__list',
  footer: '.eqftp-footer',
  menuHolder: '.eqftp-menu',
  toastHolder: '.eqftp-toast',
  queueElementholder: '.eqftp-queue'
};

var panel = tpls['panel']();

panel.find(elements.dropdownElementholder).append(tpls['dropdownElement']({
  id: 'abc123',
  title: 'Short',
  user: 'root',
  host: '111.222.333.444'
}));
panel.find(elements.dropdownElementholder).append(tpls['dropdownElement']({
  id: 'abc123doesntmatter',
  title: 'Long Connection Title Test it-321.32.33_a',
  user: 'shitmynameisbiglikemydick',
  host: 'ftp.pretty-long-websitename.com.ua.ru'
}));

var connection_idle = function () { return tpls['connectionElement']({
  id: 'test123',
  status: 'idle',
  name: 'Connection Name Pretty Long I guess',
  login: 'veeeerylongnameprettylong',
  host: '111.222.333.444'
}); };
var connection_connected = function () { return tpls['connectionElement']({
  id: '123test',
  status: 'connected',
  name: 'Test',
  login: 'root',
  host: 'kappa.com'
}); };
var connection_error = function () { return tpls['connectionElement']({
  id: '123test123',
  status: 'error',
  name: 'WOOOOW',
  login: 'anonymous',
  host: 'test.com'
}); };
panel.find(elements.connectionsElementholder).append(connection_idle());
panel.find(elements.connectionsElementholder).append(connection_connected());

panel.find(elements.queueElementholder).append(tpls['queueElement']({
  class: '',
  icon: 'file_upload',
  error_text: '',
  localpath: 'C:\programfiles\foo\bar\whatever.js',
  localname: 'whatever.js',
  remotepath: '/var/www/html/whatever.js',
  remotename: 'whatever.js',
  size: '100 kb',
  percents: '50%'
}));
panel.find(elements.queueElementholder).append(tpls['queueElement']({
  class: 'eqftp-queue__item_error',
  icon: 'error',
  error_text: 'Error',
  localpath: 'C:\programfiles\foo\bar\whatever.js',
  localname: 'whatever_longname_superlong_man.jsonononononono',
  remotepath: '/var/www/html/whatever.js',
  remotename: 'actuallyshort.noitsnot',
  size: '999 bytes',
  percents: '20%'
}));
var queue_element = function () { return tpls['queueElement']({
  class: '',
  icon: 'file_download',
  error_text: '',
  localpath: 'C:\programfiles\foo\bar\whatever.js',
  localname: '.okay',
  remotepath: '/var/www/html/whatever.js',
  remotename: '.htaccess?',
  size: '666 TB',
  percents: '0%'
}); };
panel.find(elements.queueElementholder)
  .append(queue_element())
  .append(queue_element())
;

var _file_short = function () {
    return tpls['fileTreeElement-file']({
      cmd_download: '',
      date_formatted: '03-03-2030 12:20:45',
      size_formatted: '20.9 kb',
      name_short: 'short',
      extdot: '.',
      extension: 'ext'
    });
  },
  _file_long = function () {
    return tpls['fileTreeElement-file']({
      cmd_download: '',
      date_formatted: '03-03-2030 12:20:45',
      size_formatted: '20.9 kb',
      name_short: 'oh its a big name of file shit dawg how big is it no ones know dawg i wonder myself',
      extdot: '.',
      extension: 'ext'
    });
  },
  _folder_short = function () {
    return tpls['fileTreeElement-folder']({
      cmd_openFolder: 'showChildren(this);',
      fullPath: '',
      date_formatted: '03-03-2030 12:20:45',
      size_formatted: '',
      name_short: 'foldershrt',
      name: 'foldershrt',
      extdot: '.',
      extension: ''
    });
  },
  _folder_long = function () {
    return tpls['fileTreeElement-folder']({
      cmd_openFolder: 'showChildren(this);',
      fullPath: '',
      date_formatted: '03-03-2030 12:20:45',
      size_formatted: '',
      name_short: 'This folder has hude name who would name folder like that i dont know man what about you',
      name: 'This folder has hude name who would name folder like that i dont know man what about you',
      extdot: '.',
      extension: ''
    });
  },
  kidsful = function () {
    return tpls['fileTreeElement-folder']({
      cmd_openFolder: 'showChildren(this);',
      fullPath: '',
      date_formatted: '03-03-2030 12:20:45',
      name_short: 'with subs',
      name: 'with subs',
      extdot: '.',
      size_formatted: '',
      extension: ''
    });
  };
var k = kidsful();
k.find('.eqftp-fileTree__itemChildren')
  .append(_folder_long())
  .append(_folder_long())
  .append(_folder_short())
  .append(_folder_short())
  .append(_file_long())
  .append(_file_long())
  .append(_file_long());
var nk = false;
nk = k.clone();
nk.find('.eqftp-fileTree__itemChildren').prepend(k);
k = nk;
nk = k.clone();
nk.find('.eqftp-fileTree__itemChildren').prepend(k);
k = nk;

panel.find(elements.fileTreeElementholder)
  .append(k)
  .append(_folder_long())
  .append(_folder_long())
  .append(_folder_short())
  .append(_file_short());

panel.find(elements.logElementholder)
  .append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  }))
  .append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  }))
  .append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank',
    type: 'material-icons_ok'
  }))
  .append(tpls['logElement']({
    icon: 'not_interested',
    time: '22:10:05',
    text: 'lol short log',
    type: 'material-icons_error'
  }));

$('#generate').replaceWith(panel);

var menu = $(document).find(elements.menuHolder);
//menu.show();
menu.append(tpls['menuElement']({
  text: 'Menu item',
  attrs: 'onclick="console.log(\'test\')"',
  shortcut: '⌘+F'
}));
menu.append(tpls['menuElement']({
  text: 'Menu item ver long as fuck man so long item menu item item',
  attrs: 'onclick="console.log(\'test 2\')"',
  shortcut: ''
}));
menu.append(tpls['menuElement']({
  text: 'Menu item ver long as fuck man so ',
  attrs: 'onclick="console.log(\'test 3\')"',
  shortcut: 'Alt+Ctrl+F'
}));

var toast = $(document).find(elements.toastHolder);
toast.append(tpls['toastElement']({
  text: 'File index.php uploaded',
  action: ''
}));
toast.append(tpls['toastElement']({
  text: 'File downloaded (12)',
  action: ''
}));
toast.append(tpls['toastElement']({
  text: 'Rename file on server?',
  action: 'RENAME'
}));

/* Dummies below to avoid errors */
window.eqftp = {
  connect: function () {},
  ui: {
    panel: {
      switchTo: function (tab) {
        $('.eqftp-header__navigation').children('.eqftp-header__navigationTab_' + tab).addClass('eqftp-header__navigationTab_active').siblings().removeClass('eqftp-header__navigationTab_active');
        $('.eqftp-content').children('.eqftp-content__page_' + tab).addClass('eqftp-content__page_active').siblings().removeClass('eqftp-content__page_active');
      }
    },
    search: {
      toggle: function () {
        $('.eqftp-header__search').toggleClass('eqftp-header__search_active');
        $('.eqftp-header__dropdown').toggleClass('eqftp-header__dropdown_active');
        $('.eqftp-header__dropdownList').toggleSlide(80);
      },
      filter: function () {}
    },
    log: {
      toggle: function () {
        $('.eqftp-footer').toggleClass('eqftp-footer_active');
      }
    },
    connections: {
      new: function () {
        $('.eqftp-connectionsSettings').toggleClass('eqftp-connectionsSettings_active');
      },
      edit: function () {
        $('.eqftp-connectionsSettings').toggleClass('eqftp-connectionsSettings_active');
      },
      editor: {
        close: function () {
          $('.eqftp-connectionsSettings').toggleClass('eqftp-connectionsSettings_active');
        }
      }
    }
  },
  openFolder: function (element) {
    var text = $(element).find('.material-icons').text();
    if (text == 'keyboard_arrow_right') {
      $(element).find('.material-icons').text('keyboard_arrow_down');
    } else {
      $(element).find('.material-icons').text('keyboard_arrow_right');
    }
    $(element).next('.eqftp-fileTree__itemChildren').slideToggle(100);
  },
}
