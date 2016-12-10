var tpls = {};
$.ajaxSetup({
  async: false
});
['connectionsElement', 'dropdownItem', 'fileTreeElement-file', 'fileTreeElement-folder', 'panel', 'queueElement'].forEach(function (tpl) {
  $.get('htmlContent/' + tpl + '.html', function (t, status, resp) {
    console.log(resp.responseText);
    tpls[tpl] = function (params) {
      return $(Mustache.render(resp.responseText, params));
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

panel.find(elements.dropdownElementholder).append(tpls['dropdownItem']());
panel.find(elements.dropdownElementholder).append(tpls['dropdownItem']());

panel.find(elements.connectionsElementholder).append(tpls['connectionsElement']());
panel.find(elements.connectionsElementholder).append(tpls['connectionsElement']());
panel.find(elements.connectionsElementholder).append(tpls['connectionsElement']());
panel.find(elements.connectionsElementholder).append(tpls['connectionsElement']());

panel.find(elements.queueElementholder).append(tpls['queueElement']());
panel.find(elements.queueElementholder).append(tpls['queueElement']());
panel.find(elements.queueElementholder).append(tpls['queueElement']());

var withkids = tpls['fileTreeElement-folder']();
withkids.find('.children').append(tpls['fileTreeElement-folder']());
withkids.find('.children').append(tpls['fileTreeElement-folder']());
withkids.find('.children').append(tpls['fileTreeElement-folder']());
withkids.find('.children').append(tpls['fileTreeElement-folder']());
withkids.find('.children').append(tpls['fileTreeElement-file']());
withkids.find('.children').append(tpls['fileTreeElement-file']());
withkids.find('.children').append(tpls['fileTreeElement-file']());
withkids.find('.children').append(tpls['fileTreeElement-file']());
panel.find(elements.fileTreeElementholder).append(withkids);
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-folder']());
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-folder']());
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-folder']());
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-file']());
panel.find(elements.fileTreeElementholder).append(tpls['fileTreeElement-file']());

$('#generate').replaceWith(panel);
