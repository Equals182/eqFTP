var tpls = {};
$.ajaxSetup({
  async: false
});
['connectionsElement', 'dropdownItem', 'fileTreeElement-file', 'fileTreeElement-folder', 'panel', 'queueElement', 'logElement'].forEach(function (tpl) {
  $.get('htmlContent/' + tpl + '.html', function (t, status, resp) {
    tpls[tpl] = function (params) {
      return $(Mustache.render(resp.responseText, (params || {})));
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
  queueElementholder: '.eqftp-query'
};

var panel = tpls['panel']();

panel.find(elements.dropdownElementholder).append(tpls['dropdownItem']({
  id: 'abc123',
  title: 'Short',
  user: 'root',
  host: '111.222.333.444'
}));
panel.find(elements.dropdownElementholder).append(tpls['dropdownItem']({
  id: 'abc123doesntmatter',
  title: 'Long Connection Title Test it-321.32.33_a',
  user: 'shitmynameisbiglikemydick',
  host: 'ftp.pretty-long-websitename.com.ua.ru'
}));

panel.find(elements.connectionsElementholder).append(tpls['connectionsElement']());
panel.find(elements.connectionsElementholder).append(tpls['connectionsElement']());
panel.find(elements.connectionsElementholder).append(tpls['connectionsElement']());
panel.find(elements.connectionsElementholder).append(tpls['connectionsElement']());

panel.find(elements.queueElementholder).append(tpls['queueElement']());
panel.find(elements.queueElementholder).append(tpls['queueElement']());
panel.find(elements.queueElementholder).append(tpls['queueElement']());

var _file_short = function () {
    return tpls['fileTreeElement-file']({
      cmd_download: '',
      date_formatted: '03-03-2030 12:20:45',
      size_formatted: '20.9 kb',
      name_short: 'short',
      extension: 'ext'
    });
  },
  _file_long = function () {
    return tpls['fileTreeElement-file']({
      cmd_download: '',
      date_formatted: '03-03-2030 12:20:45',
      size_formatted: '20.9 kb',
      name_short: 'oh its a big name of file shit dawg how big is it no ones know dawg i wonder myself',
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
      extension: ''
    });
  },
  kidsful = function () {
    return tpls['fileTreeElement-folder']({
      cmd_openFolder: 'showChildren(this);',
      fullPath: '',
      date_formatted: '03-03-2030 12:20:45',
      name_short: 'with subs',
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
  .append(_folder_short())
  .append(_file_long())
  .append(_file_long())
  .append(_file_long())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
  .append(_file_short())
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
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  })).append(tpls['logElement']({
    icon: 'done',
    time: '22:10:05',
    text: 'lol -content__page eqftp-content__page_blank ps-container ps-theme-default" data-ps-id="e67da67e-19b2-9f31-8913-f8f5b6ddbbd8',
    type: 'material-icons_info'
  }))
  .append(tpls['logElement']({
    icon: 'not_interested',
    time: '22:10:05',
    text: 'lol short log',
    type: 'material-icons_error'
  }));

$('#generate').replaceWith(panel);

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
  }
}
