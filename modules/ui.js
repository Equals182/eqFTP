/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */
/*global $, define, brackets */

define(function (require, exports, module) {
  "use strict";
  var Mustache = brackets.getModule("thirdparty/mustache/mustache"),
      strings = require("strings"),
      eqUI = this,
      _ = false,
      eqFTP = false,
      utils = false;
  
  eqUI.eqftp = function (e) {
    if (!eqFTP) {
      eqFTP = e;
    }
    if (!utils) {
      utils = eqFTP.utils;
    }
    if (!_) {
      _ = eqFTP.utils._;
    }
    eqUI.eqftp = eqFTP;
    return eqFTP;
  }
  
  eqUI.events = function (event) {
    if (!event) {
      return false;
    }
    if (event.action) {
      switch (event.action) {
        case 'ready:html':
          // Appending eqFTP button on toolbar
          $("#main-toolbar .buttons").append(eqUI.toolbarIcon.get());
          // Appending eqFTP panel after content
          $("body > .main-view > .content").after(eqUI.panel.get());
          break;
        case 'ready:app':
          eqUI.toolbarIcon.activate();
          break;
      }
    }
  };
  
  eqUI.toolbarIcon = new function() {
    var self = this;
    self.tpl = $(Mustache.render(require("text!htmlContent/toolbarIcon.html"), strings));
    self.tpl.on('click', function () {
      if (!$(this).hasClass('disabled')) {
        eqUI.panel.toggle();
      }
    });
    self.activate = function () {
      self.tpl.removeClass('disabled');
    };
    self.deactivate = function () {
      self.tpl.addClass('disabled');
    };
    self.get = function () {
      return self.tpl;
    };
  }();
  
  eqUI.panel = new function () {
    var self = this;
    self.state = 'closed';
    self.tpl = $(Mustache.render(require("text!htmlContent/panel.html"), strings));
    self.tpl.css('right', '-300px');
    
    self.open = function () {
      if (self.state === 'closed') {
        self.tpl.show();
        $("body > .main-view > .content").animate({
          right: (self.tpl.outerWidth() + 30) + 'px'
        }, 200, function () {
          self.state = 'opened';
        });
        self.tpl.animate({
          right: '30px'
        }, 200);
      }
    };
    self.close = function () {
      if (self.state === 'opened') {
        $("body > .main-view > .content").animate({
          right: '30px'
        }, 200, function () {
          self.state = 'closed';
        });
        self.tpl.animate({
          right: (self.tpl.outerWidth() * -1) + 'px'
        }, 200, function () {
          self.tpl.hide();
        });
      }
    };
    self.toggle = function () {
      if (self.state === 'opened') {
        self.close();
      } else {
        self.open();
      }
    };
    self.switchTo = function (tab) {
      $('.eqftp-header__navigation').children('.eqftp-header__navigationTab_'+tab).addClass('eqftp-header__navigationTab_active').siblings().removeClass('eqftp-header__navigationTab_active');
      $('.eqftp-content').children('.eqftp-content__page_'+tab).addClass('eqftp-content__page_active').siblings().removeClass('eqftp-content__page_active');
    };
    
    self.get = function () {
      return self.tpl;
    };
  }();
  
  eqUI.search = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-header__search');
    var dropdown = self.tpl.find('.eqftp-header__dropdown');
    var dropdownItemsHolder = self.tpl.find('.eqftp-header__dropdownList');
    self.state = 'closed';
    self.dropdownState = 'closed';
    self.items = [];

    self.dropdown = {};
    self.dropdown.toggle = function () {
      if (self.dropdownState === 'opened') {
        self.dropdown.close();
      } else {
        self.dropdown.open();
      }
    };
    self.dropdown.open = function () {
      if (self.dropdownState === 'closed') {
        dropdown.addClass('eqftp-header__dropdown_active');
        dropdownItemsHolder.slideDown(80, function () {
          self.dropdownState = 'opened';
        });
      }
    };
    self.dropdown.close = function () {
      if (self.dropdownState === 'opened') {
        dropdown.removeClass('eqftp-header__dropdown_active');
        dropdownItemsHolder.slideUp(80, function () {
          self.dropdownState = 'closed';
        });
      }
    };
    self.dropdown.resetItems = function () {
      self.items = [];
      dropdownItemsHolder.html('');
    };
    self.dropdown.addItem = function (item) {
      dropdownItemsHolder.append(self.getItem(item));
    };
    
    self.toggle = function () {
      if (self.state === 'opened') {
        self.close();
      } else {
        self.open();
      }
    };
    self.open = function () {
      if (self.state === 'closed') {
        self.tpl.addClass('eqftp-header__search_active');
        self.state = 'opened';
        self.tpl.find('input[name="eqftpSearch"]').focus();
        self.dropdown.open();
      }
    };
    self.close = function () {
      if (self.state === 'opened') {
        self.tpl.removeClass('eqftp-header__search_active');
        self.state = 'closed';
        self.dropdown.close();
      }
    };
    self.filter = function (keyword) {
      if (keyword) {
        if (utils) {
          keyword = utils.escapeRegExp(keyword);
        }
        var r = new RegExp('.*?' + keyword + '.*?');
        self.items.forEach(function (v, i) {
          if (!r.test(v.text())) {
            v.hide();
          } else {
            v.show();
          }
        });
      } else {
        self.items.forEach(function (v, i) {
          v.show();
        });
      }
    };

    self.get = function () {
      return self.tpl;
    };
    self.getItem = function (item) {
      if (!_.isObject(item)) {
        item = {};
      }
      item = $(Mustache.render(require("text!htmlContent/dropdownItem.html"), _.defaults(_.clone(strings), item)));
      self.items.push(item);
      return item;
    };
  }();

  eqUI.fileTree = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-fileTree');
    self._t = {
      d: require("text!htmlContent/fileTreeElement-folder.html"),
      f: require("text!htmlContent/fileTreeElement-file.html")
    };
    self._rendered = {};

    self.add = function (object, path) {
      /*if (_.isArray(object)) {
        object.forEach(function (o) {
          self.add(o, path);
        });
        self._rendered[path] = object;
      } else if (_.isObject(object)) {
        var holder = self.tpl;
        
        var is_shortest = true,
            toreappend = [],
            
        if (self._rendered) {
          if (_.has(self._rendered, path)) {
            holder = holder.find('[id="' + path + '"]').find('.children:first');
          } else {
                r = RegExp("^" + path);
            _.forOwn(self._rendered, function (object, rpath) {
              if (r.test(rpath)) {
                toreappend.push([object, rpath]);
              }
              if (rpath.length > path.length) {
                is_shortest = false;
              }
            });
          }
        }
        
        if (['f', 'd'].indexOf(object.type) < 0) {
          return false;
        }
        holder.append($(Mustache.render(self._t[object.type], _.defaults(_.clone(strings), object, {
          date_formatted: function () {
            if (utils) {
              return utils.date_format(new Date(object.date), 'd-m-Y');
            } else {
              return object.date;
            }
          },
          size_formatted: function () {
            return utils.filesize_format(object.size, 1, [
              strings.eqftp__filesize_bytes,
              strings.eqftp__filesize_kilobytes,
              strings.eqftp__filesize_megabytes,
              strings.eqftp__filesize_gigabytes,
              strings.eqftp__filesize_terabytes,
              strings.eqftp__filesize_petabytes,
              strings.eqftp__filesize_exabytes,
              strings.eqftp__filesize_zettabytes,
              strings.eqftp__filesize_yottabytes
            ]);
          },
          name_short: function () {
            return utils.getNamepart(object.name, 'name_noext');
          },
          extension: function () {
            return utils.getNamepart(object.name, 'ext');
          }
        }))));
        if (!holder.is(':visible')) {
          holder.slideDown(100);
        }
      }*/
    };
    self.get = function () {
      return self.tpl;
    }
  }();
  
  /*
  eqUI.dropdown = new function () {
    var self = this;
    self.tpl = $(Mustache.render(require("text!htmlContent/dropdown.html"), strings));
    self.get = function () {
      return self.tpl;
    }
  };
  */
  
  return eqUI;
});