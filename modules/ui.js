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
      utils = false,
      
      localeSizes = [
        strings.eqftp__filesize_bytes,
        strings.eqftp__filesize_kilobytes,
        strings.eqftp__filesize_megabytes,
        strings.eqftp__filesize_gigabytes,
        strings.eqftp__filesize_terabytes,
        strings.eqftp__filesize_petabytes,
        strings.eqftp__filesize_exabytes,
        strings.eqftp__filesize_zettabytes,
        strings.eqftp__filesize_yottabytes
      ];
  
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
  };
  eqUI.m = Mustache.render;
  
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
          if (eqUI.ps) {
            eqUI.ps.initialize($('.eqftp-content__page_file-tree')[0]);
            eqUI.ps.initialize($('.eqftp-content__page_queue')[0]);
            eqUI.ps.initialize($('.eqftp-header__dropdown')[0]);
          }
          break;
        case 'ready:app':
          eqUI.toolbarIcon.activate();
          break;
        case 'queue:update':
          eqUI.queue.render(event.data);
          break;
        case 'queue:progress':
          eqUI.queue.progress(event.data);
          break;
        case 'connection:update':
          eqUI.connections.render(event.data);
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
    var width = 360;
    self.state = 'closed';
    self.tpl = $(Mustache.render(require("text!htmlContent/panel.html"), strings)).filter('.eqftp');
    self.tpl.css('right', (width * -1) + 'px').width(width);
    
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
          eqUI.ps.update(dropdown[0]);
        });
      }
    };
    self.dropdown.close = function () {
      if (self.dropdownState === 'opened') {
        dropdown.removeClass('eqftp-header__dropdown_active');
        dropdownItemsHolder.slideUp(80, function () {
          self.dropdownState = 'closed';
          eqUI.ps.update(dropdown[0]);
        });
      }
    };
    self.dropdown.resetItems = function () {
      self.items = [];
      dropdownItemsHolder.html('');
      eqUI.ps.update(dropdown[0]);
    };
    self.dropdown.addItem = function (item) {
      dropdownItemsHolder.append(self.getItem(item));
      eqUI.ps.update(dropdown[0]);
    };
    
    self._autoclose = function (e) {
      console.log(!$(e.target).is('.eqftp-header__search'));
      console.log($(e.target).closest('.eqftp-header__search'), $(e.target).closest('.eqftp-header__search').length);
      if (!$(e.target).is('.eqftp-header__search') && $(e.target).closest('.eqftp-header__search').length < 1) {
        self.close();
      }
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
        
        _.delay(function () {
          $('body').on('click', self._autoclose);
        }, 50);
      }
    };
    self.close = function () {
      if (self.state === 'opened') {
        self.tpl.removeClass('eqftp-header__search_active');
        self.state = 'closed';
        self.dropdown.close();
        
        $('body').off('click', self._autoclose);
      }
    };
    self.filter = function (keyword, e) {
      var p = utils.parseConnectionString(keyword);
      if (p) {
        if (e && e.keyCode === 13) {
          eqftp.connect(p);
          return true;
        }
      }
      if (keyword) {
        if (utils) {
          keyword = utils.escapeRegExp(keyword);
        }
        var r = new RegExp('.*?' + keyword + '.*?'),
            shown = 0;
        self.items.forEach(function (v, i) {
          if (!r.test(v.text())) {
            v.hide();
          } else {
            v.show();
            shown++;
          }
        });
        if (!shown) {
          self.dropdown.close();
        }
      } else {
        self.items.forEach(function (v, i) {
          v.show();
        });
      }
      eqUI.ps.update(dropdown[0]);
    };

    self.get = function () {
      return self.tpl;
    };
    self.getItem = function (item) {
      if (!_.isObject(item)) {
        item = {};
      }
      item = $(Mustache.render(require("text!htmlContent/dropdownElement.html"), _.defaults(_.clone(strings), item)));
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
      if (!_.isString(path)) {
        return false;
      }
      if (!_.isArray(object)) {
        object = [object];
      }
      
      var parent = false;
      if (!_.isEmpty(self._rendered)) {
        parent = self.tpl.find('div[id="'+path+'"] .eqftp-fileTree__itemChildren');
        if (parent.length === 0) {
          if ((((_.keys(self._rendered)).sort(utils.byLevels))[0]).levels() < path.levels()) {
            console.log("YEA");
          } else {
            console.error('cant find path in tree');
            return false;
          }
          parent = false;
        }
      }
      if (!parent) {
        parent = $('.eqftp-fileTree');
      }
      self._rendered[path] = object;
      
      parent.html('');
      object.forEach(function (element, i) {
        if (['f', 'd'].indexOf(element.type) < 0) {
          return false;
        }
        parent.append($(Mustache.render(self._t[element.type], _.defaults(_.clone(strings), element, {
          date_formatted: function () {
            if (utils) {
              var format = 'H:i d/m';
              if (_.has(eqFTP, 'settings.main.date_format')) {
                format = eqFTP.settings.main.date_format;
              }
              return utils.date_format(new Date(element.date), format);
            } else {
              return element.date;
            }
          },
          size_formatted: function () {
            return utils.filesize_format(element.size, 1, localeSizes);
          },
          name_short: function () {
            return utils.getNamepart(element.name, 'name_noext');
          },
          extdot: function () {
            return utils.getNamepart(element.name, 'extdot');
          },
          extension: function () {
            return utils.getNamepart(element.name, 'ext');
          },
          cmd_download: function () {
            return 'eqftp.download(\''+element.id+'\', \''+element.fullPath+'\', true, [...arguments][0]);';
          },
          cmd_openFolder: function () {
            return 'eqftp.openFolder(\''+element.id+'\', \''+element.fullPath+'\');';
          }
        }))));
      });
      self.itemOpen(path);
    };
    self.itemOpen = function (path) {
      var el = self.tpl.find('div[id="'+path+'"]'),
          ch = el.find('.eqftp-fileTree__itemChildren:first');
      if (!ch.is(':visible')) {
        el.find('.eqftp-fileTree__itemInfo:first .eqftp-fileTree__itemIcon .material-icons').text('keyboard_arrow_down');
        ch.slideDown(200, function () {
          if (eqUI.ps) {
            eqUI.ps.update($('.eqftp-content__page_file-tree')[0]);
          }
        });
      }
    };
    self.itemClose = function (path) {
      var el = self.tpl.find('div[id="'+path+'"]'),
          ch = el.find('.eqftp-fileTree__itemChildren:first');
      if (ch.is(':visible')) {
        el.find('.eqftp-fileTree__itemInfo:first .eqftp-fileTree__itemIcon .material-icons').text('keyboard_arrow_right');
        ch.slideUp(200, function () {
          if (eqUI.ps) {
            eqUI.ps.update($('.eqftp-content__page_file-tree')[0]);
          }
        });
      }
    };
    self.itemToggle = function (path) {
      var el = self.tpl.find('div[id="'+path+'"]'),
          ch = el.find('.eqftp-fileTree__itemChildren:first');
      if (ch.is(':visible')) {
        el.find('.eqftp-fileTree__itemInfo:first .eqftp-fileTree__itemIcon .material-icons').text('keyboard_arrow_right');
        ch.slideUp(200, function () {
          if (eqUI.ps) {
            eqUI.ps.update($('.eqftp-content__page_file-tree')[0]);
          }
        });
      } else {
        el.find('.eqftp-fileTree__itemInfo:first .eqftp-fileTree__itemIcon .material-icons').text('keyboard_arrow_down');
        ch.slideDown(200, function () {
          if (eqUI.ps) {
            eqUI.ps.update($('.eqftp-content__page_file-tree')[0]);
          }
        });
      }
    };
    self.get = function () {
      return self.tpl;
    };
    self.reset = function () {
      self.tpl.html('');
      self._rendered = {};
    };
  }();
  
  eqUI.log = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-footer__list');
    self.footer = eqUI.panel.tpl.find('.eqftp-footer');
    self.state = 'closed';
    self._hasPs = false;
    
    self.toggle = function () {
      if (self.state === 'opened') {
        self.close();
      } else {
        self.open();
      }
    };
    self.open = function () {
      if (self.state === 'closed') {
        self.footer.addClass('eqftp-footer_active');
        self.state = 'opened';
        if (!self._hasPs) {
          eqUI.ps.initialize(self.tpl[0]);
          self._hasPs = true;
          self.tpl[0].scrollTop = self.tpl[0].scrollHeight;
          eqUI.ps.update(self.tpl[0]);
        }
      }
    };
    self.close = function () {
      if (self.state === 'opened') {
        self.footer.removeClass('eqftp-footer_active');
        self.state = 'closed';
        if (self._hasPs) {
          eqUI.ps.destroy(self.tpl[0]);
          self._hasPs = false;
        }
      }
    };
    self.add = function (item) {
      item = $(Mustache.render(require("text!htmlContent/logElement.html"), _.defaults(_.clone(strings), {
        type: function () {
          return (item.type ? (item.type) : '');
        }
      }, item)));
      self.tpl.append(item);
      if (self.tpl.find('.eqftp-footer__listItem').length > 1000) {
        self.tpl.find('.eqftp-footer__listItem:first').remove();
      }
      if (self._hasPs) {
        self.tpl[0].scrollTop = self.tpl[0].scrollHeight;
        eqUI.ps.update(self.tpl[0]);
      }
    };
    
    self.get = function () {
      return self.tpl;
    };
  }();
  
  eqUI.queue = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-queue');
    self.have = [];
    
    self._gen = function (v) {
      return $(Mustache.render(require("text!htmlContent/queueElement.html"), _.defaults(_.clone(strings), {
        id: function () {
          return 'eqftp-queue-' + v.qid;
        },
        class: function () {
          return ( (v.queue === 'f') ? 'eqftp-queue__item_error' : '' );
        },
        icon: function () {
          switch (v.queue) {
            case 'a':
              switch (v.act) {
                case 'download':
                  return 'file_download';
                case 'upload':
                  return 'file_upload';
              }
            case 'f':
              return 'error';
          }
        },
        localname: function () {
          return utils.getNamepart(v.args[0].localpath, 'filename');
        },
        localpath: v.args[0].localpath,
        remotename: function () {
          return utils.getNamepart(v.args[0].remotepath, 'filename');
        },
        remotepath: v.args[0].remotepath,
        size: '0',
        percents: '0%',
        error_text: ''
      }, v)));
    };
    self.render = function (items) {
      var add = _.differenceBy(items, self.have, 'qid'),
          remove = _.differenceBy(self.have, items, 'qid'),
          change = _.intersectionBy(items, self.have, 'qid');
      
      remove.forEach(function (v, i) {
        if (v.act === 'download' || v.act === 'upload') {
          $('#eqftp-queue-' + v.qid).remove();
        }
      });
      add.forEach(function (v, i) {
        if (v.act === 'download' || v.act === 'upload') {
          self.tpl.append(self._gen(v));
        }
      });
      change.forEach(function (v, i) {
        if (!_.isEqual(self.have[_.findIndex(self.have, { qid: v.qid })], v)) {
          $('#eqftp-queue-' + v.qid).replaceWith(self._gen(v));
        }
      });
      self.have = items;
    };
    var o = false;
    self.progress = function (data) {
      if (!o) {
        o = _.once(function (el, s) {
          el.find('.eqftp-placeholder-size').text(utils.filesize_format(s, 1, localeSizes));
        });
      }
      var el = $('#eqftp-queue-' + data.queuer.qid),
          p = Math.floor(data.percents * 100),
          s = data.total;
      el.find('.eqftp__progressBar:first').css('width', p + '%');
      o(el, s);
    };
    
    self.get = function () {
      return self.tpl;
    };
  }();
  
  eqUI.connections = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-connections');
    self.items = [];
    
    self.editor = new function () {
      var connections = self,
          self = this;
      self.tpl = eqUI.panel.tpl.find('.eqftp-connectionsSettings');
      self.state = 'closed';
      var activeClass = 'eqftp-connectionsSettings_active';
      
      self.open = function () {
        if (self.state === 'closed') {
          self.tpl.addClass(activeClass);
          self.state = 'opened';
        }
      };
      self.close = function () {
        if (self.state === 'opened') {
          self.tpl.removeClass(activeClass);
          self.state = 'closed';
        }
      };
      self.toggle = function () {
        switch (self.state) {
          case 'opened':
            self.close();
            break;
          case 'closed':
            self.open();
            break;
        }
      };
      self.reset = function () {
        self.tpl.find('[name="id"]').remove();
        self.tpl.find('input, select, textarea').each(function () {
          if ($(this).is('[type=checkbox]')) {
            $(this).prop('checked', false);
          } else if ($(this).is('[type=radio]')) {
            $(this).prop('checked', false);
          } else if ($(this).is('textarea')) {
            $(this).val('');
          } else if ($(this).is('select')) {
            $(this).find('option:selected').prop('selected', false);
          } else {
            $(this).val('');
          }
        });
      };
      self.read = function () {
        var r = {};
        self.tpl.find('input, select, textarea').each(function () {
          var name = false,
              value = false;
          if ($(this).is('[type=checkbox]')) {
            name = $(this).attr('name');
            value = !!$(this).is(':checked');
          } else if ($(this).is('[type=radio]')) {
            name = $(this).attr('name');
            value = $(this).val();
          } else if ($(this).is('textarea')) {
            name = $(this).attr('name');
            value = $(this).val();
          } else if ($(this).is('select')) {
            name = $(this).attr('name');
            value = $(this).val();
          } else {
            name = $(this).attr('name');
            value = $(this).val();
          }
          r[name] = value;
        });
        return r;
      };
      
      self.edit = function (connection) {
        self.reset();
        if (connection) {
          if (_.isString(connection)) {
            connection = eqFTP.connections[connection];
            if (!connection) {
              return false;
            }
          }
          if (!_.isObject(connection)) {
            return false;
          }
          _.forOwn(connection, function (value, name) {
            var c = self.tpl.find('[name="' + name + '"]');
            if (c.length > 0) {
              if (c.is('[type=checkbox]')) {
                c.prop('checked', !!value);
              } else if (c.is('[type=radio]')) {
                c.find('[value="' + value + '"]').prop('checked', true);
              } else if (c.is('textarea')) {
                c.val(value);
              } else if (c.is('select')) {
                c.find('[value="' + value + '"]').prop('selected', true);
              } else {
                c.val(value);
              }
            }
          });
          self.tpl.append('<input name="id" type="hidden" value="' + connection.id + '"/>');
        }
        self.open();
      };
      self.new = function () {
        return self.edit({
          autoupload: true,
          check_difference: true
        });
      };
    }();
    
    self._gen = function (connection) {
      return $(Mustache.render(require("text!htmlContent/connectionElement.html"), _.defaults(_.clone(strings), {
        host: connection.server
      }, connection)));
    };
    self.render = function (connections) {
      if (_.isObject(connections)) {
        var _c = [];
        _.forOwn(connections, function (v, i) {
          _c.push(v);
        });
        connections = _c;
      }
      if (!_.isArray(connections)) {
        return false;
      }
      /*
      connections.sort(function (a, b) {
        return a.index - b.index;
      });
      */
      self.tpl.html('');
      self.items = [];
      connections.forEach(function (v, i) {
        var el = self._gen(v);
        self.items.push(el);
        self.tpl.append(el);
      });
    };
    self.filter = function (keyword, e) {
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
    self.edit = self.editor.edit;
    self.new = self.editor.new;
    
    self.get = function () {
      return self.tpl;
    };
  };
  
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