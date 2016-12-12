var tpls = {};
$.ajaxSetup({
  async: false
});
['connectionsElement', 'dropdownItem', 'fileTreeElement-file', 'fileTreeElement-folder', 'panel', 'queueElement'].forEach(function (tpl) {
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

var withkids = tpls['fileTreeElement-folder']({
  date_formatted: '03-03-2030 12:20:45',
  name_short: 'WITH SUBS',
  size_formatted: '',
  extension: ''
});
withkids.find('.eqftp-fileTree__itemChildren').append(tpls['fileTreeElement-folder']({
  date_formatted: '03-03-2030 12:20:45',
  name_short: 'sub',
  size_formatted: '',
  extension: ''
}));
withkids.find('.eqftp-fileTree__itemChildren').append(tpls['fileTreeElement-folder']({
  date_formatted: '03-03-2030 12:20:45',
  name_short: 'vsubar',
  size_formatted: '',
  extension: ''
}));
withkids.find('.eqftp-fileTree__itemChildren').append(tpls['fileTreeElement-folder']({
  date_formatted: '03-03-2030 12:20:45',
  name_short: 'dev_ooooh im bad and long string here i am come handle me boi',
  size_formatted: '',
  extension: ''
}));
withkids.find('.eqftp-fileTree__itemChildren').append(tpls['fileTreeElement-folder']({
  date_formatted: '03-03-2030 12:20:45',
  name_short: 'binary',
  size_formatted: '',
  extension: ''
}));
withkids.find('.eqftp-fileTree__itemChildren').append(tpls['fileTreeElement-file']({
  date_formatted: '03-03-2030 12:20:45',
  size_formatted: '12.1 mb',
  name_short: 'aquota',
  extension: 'group'
}));
withkids.find('.eqftp-fileTree__itemChildren').append(tpls['fileTreeElement-file']({
  date_formatted: '03-03-2030 12:20:45',
  size_formatted: '20.9 kb',
  name_short: 'limit',
  extension: 'user'
}));
withkids.find('.eqftp-fileTree__itemChildren').append(tpls['fileTreeElement-file']({
  date_formatted: '03-03-2030 12:20:45',
  size_formatted: '12.1 mb',
  name_short: 'aquota',
  extension: 'group'
}));
withkids.find('.eqftp-fileTree__itemChildren').append(tpls['fileTreeElement-file']({
  date_formatted: '03-03-2030 12:20:45',
  size_formatted: '20.9 kb',
  name_short: 'limit',
  extension: 'user'
}));
panel.find(elements.fileTreeElementholder).append(withkids);
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-folder']({
  date_formatted: '03-03-2030 12:20:45',
  name_short: 'var',
  size_formatted: '',
  extension: ''
}));
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-folder']({
  date_formatted: '03-03-2030 12:20:45',
  name_short: 'home sweet home sweet home sweet home sweet home sweet home',
  size_formatted: '',
  extension: ''
}));
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-folder']({
  date_formatted: '03-03-2030 12:20:45',
  name_short: 'usr',
  size_formatted: '',
  extension: ''
}));
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-file']({
  date_formatted: '03-03-2030 12:20:45',
  size_formatted: '12.1 mb',
  name_short: 'aquota',
  extension: 'group'
}));
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-file']({
  date_formatted: '03-03-2030 12:20:45',
  size_formatted: '20.9 kb',
  name_short: 'limit',
  extension: 'user'
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
    }
  }
}
