/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */
/*global $, define, brackets */

define(function (require, exports, module) {
  "use strict";
  var Mustache = brackets.getModule("thirdparty/mustache/mustache"),
      FileSystem = brackets.getModule("filesystem/FileSystem"),
      Resizer = brackets.getModule("utils/Resizer"),
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

  strings.eqftp__misc__credits_text = Mustache.render(strings.eqftp__misc__credits_text, {
    names: '<span href="https://github.com/Equals182" class="eqftp__text eqftp__text_colorBlue eqftp__link">Equals182</span> & <span href="https://github.com/GoliafRS" class="eqftp__text eqftp__text_colorBlue eqftp__link">GoliafRS</span>'
  });
  strings.eqftp__misc__donate_text = Mustache.render(strings.eqftp__misc__donate_text, {
    button: '<span href="https://www.patreon.com/equals182" class="eqftp__button eqftp__button_blueText eqftp__link">' + strings.eqftp__misc__donate_button + '</span>'
  });

  function getInputNameValue(input) {
    var name = false,
        value = false;
    if (input.is('[type=checkbox]')) {
      name = input.attr('name');
      value = !!input.is(':checked');
    } else if (input.is('[type=radio]')) {
      name = input.attr('name');
      value = input.val();
    } else if (input.is('textarea')) {
      name = input.attr('name');
      value = input.val();
    } else if (input.is('select')) {
      name = input.attr('name');
      value = input.val();
    } else {
      name = input.attr('name');
      value = input.val() || '';
    }
    if (!name) {
      return false;
    } else {
      return {
        name: name,
        value: value
      };
    }
  };

  function setInputNameValue(input, value) {
    if (!input || !input.length) {
      return false;
    }
    if (!value) {
      if (input.is('[type=checkbox]')) {
        input.prop('checked', false);
      } else if (input.is('[type=radio]')) {
        input.prop('checked', false);
      } else if (input.is('textarea')) {
        input.val('');
      } else if (input.is('select')) {
        input.find('option:selected').prop('selected', false);
      } else {
        input.val('');
      }
    } else {
      if (input.is('[type=checkbox]')) {
        input.prop('checked', !!value);
      } else if (input.is('[type=radio]')) {
        input.find('[value="' + value + '"]').prop('checked', true);
      } else if (input.is('textarea')) {
        input.val(value);
      } else if (input.is('select')) {
        input.find('[value="' + value + '"]').prop('selected', true);
      } else {
        input.val((value || ''));
      }
    }
    input.change();
  };

  eqUI.eqftp = function (e) {
    if (!eqFTP) {
      eqFTP = e;
    }
    if (!utils) {
      utils = eqFTP.utils;
    }
    if (!_) {
      _ = eqFTP.utils._;
      eqUI.panel._resyncSizer = _.throttle(eqUI.panel._resyncSizer, 100);
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
          var resizer = eqUI._dragndrop.new(function (dx, dy, event) {
            //moving
            eqUI.panel.resize(-1 * dx);
          }, function () {
            //up
          });
          eqUI.panel.get().prepend(resizer);
          eqUI.panel.get().on('click', '.eqftp__link', function () {
            eqUI.eqftp._openInBrowser($(this).attr('href'));
          });
          $("body").prepend(eqUI.context.get());
          if (eqUI.ps) {
            //eqUI._scrollbar.add($('.eqftp-content__page_file-tree')[0]);
            eqUI._scrollbar.add($('.eqftp-fileTree')[0]);
            eqUI._scrollbar.add($('.eqftp-content__page_queue')[0]);
            eqUI._scrollbar.add($('.eqftp-header__dropdown')[0]);
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

  eqUI.toolbarIcon = new function () {
    var self = this;
    self.tpl = $(Mustache.render(require("text!htmlContent/toolbarIcon.html"), strings));
    self.tpl.on('click', function () {
      if (!$(this).hasClass('eqftp-toolbar__icon_disable')) {
        eqUI.panel.toggle();
      }
    });
    self.activate = function () {
      self.tpl.removeClass('eqftp-toolbar__icon_disable');
    };
    self.deactivate = function () {
      self.tpl.addClass('eqftp-toolbar__icon_disable');
    };
    self.get = function () {
      return self.tpl;
    };
  }();

  eqUI.panel = new function () {
    var self = this;
    var width = 360,
        m_width = width * 2;
    var content = $("body > .main-view > .content");
    self.p = $(Mustache.render(require("text!htmlContent/panel.html"), strings));
    self.state = 'closed';
    self.tpl = self.p.filter('.eqftp');
    self.tpl.css('right', (width * -1) + 'px').width(width);
    self._currentTab = false;
    self.title = new function () {
      var title = this;
      title._element = self.tpl.find('.eqftp-header .eqftp-head .eqftp__title span');
      title.set = function (text) {
        title._element.text(text || 'eqFTP');
      };
      title.update = function () {
        if (self._currentTab) {
          switch (self._currentTab) {
            case 'fileTree':
            case 'file-tree':
            case 'file tree':
              title.set(eqUI.fileTree.title._current);
              break;
            case 'queue':
              title.set(eqUI.queue.title._current);
              break;
            case 'connections':
              title.set(eqUI.connections.title._current);
              break;
            case 'settings':
              title.set(eqUI.settings.title._current);
              break;
            default:
              title.set();
              break;
          }
        }
      };
    }();

    self._resyncSizer = function () {
      Resizer.resyncSizer('#editor-holder #first-pane');
    };
    self.resize = function (plus) {
      plus = parseInt(plus);
      if (isNaN(plus)) {
        plus = 0;
      }
      var nw = (self.tpl.width() + plus);
      if (nw < width) {
        nw = width;
      } else if (nw > m_width) {
        nw = m_width;
      }
      self.tpl.width(nw + 'px');
      content.css('right', (self.tpl.outerWidth() + 30) + 'px');
      self._resyncSizer();
    };
    self.open = function () {
      if (self.state === 'closed') {
        self.tpl.show();
        content.animate({
          right: (self.tpl.outerWidth() + 30) + 'px'
        }, 200, function () {
          self.state = 'opened';
          if (eqUI.password.state === 'shown') {
            eqUI.password._input.focus();
          }
          self._resyncSizer();
        });
        self.tpl.animate({
          right: '30px'
        }, 200);
      }
    };
    self.close = function () {
      if (self.state === 'opened') {
        content.animate({
          right: '30px'
        }, 200, function () {
          self.state = 'closed';
          self._resyncSizer();
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
      $('.eqftp-header__navigation').children('.eqftp-header__navigationTab_' + tab).addClass('eqftp-header__navigationTab_active').siblings().removeClass('eqftp-header__navigationTab_active');
      $('.eqftp-content').children('.eqftp-content__page_' + tab).addClass('eqftp-content__page_active').siblings().removeClass('eqftp-content__page_active');
      self._currentTab = tab;
      self.title.update();
    };

    self.get = function () {
      return self.tpl;
    };
  }();

  eqUI.context = new function () {
    var self = this;
    self.tpl = eqUI.panel.p.filter('.eqftp-menu');
    self.elementTemplate = require("text!htmlContent/menuElement.html");
    self.current = {};
    self._craft = function (text, callback, shortcut) {
      var item = new function () {
        var item = this;
        item.id = utils.uniq();
        item.element = $(Mustache.render(self.elementTemplate, _.defaults({
          text: text,
          shortcut: shortcut
        }, strings)));
        item.remove = function () {
          item.element.off('click', item.callback);
          item.element.remove();
          _.unset(self.current, item.id);
        };
        item.callback = _.once(function () {
          self.close();
          if (_.isFunction(callback)) {
            callback(...arguments);
          }
        });
        item.element.on('click', item.callback);
        _.set(self.current, item.id, item);
      }();
      return item;
    };
    self._reset = function () {
      _.forOwn(self.current, function (item) {
        item.remove();
      });
      $('body').off('click', self._autoclose);
      self.current = {};
      self.tpl.html('');
    };
    self.caller = false;
    self._autoclose = function (e) {
      if (!$(e.target).is(self.tpl) &&
          $(e.target).closest(self.tpl).length < 1 &&
          self.caller &&
          _.isjQuery(self.caller) &&
          !$(e.target).is(self.caller) &&
          $(e.target).closest(self.caller).length < 1
         ) {
        self.close();
      }
    };
    self.close = function () {
      self._reset();
      self.tpl.hide();
      $('body').off('click', self._autoclose);
    };
    self.open = function (items, position, caller) {
      self._reset();
      if (caller && _.isjQuery(caller)) {
        self.caller = caller;
      }
      if (_.isArray(items) && items.length > 0) {
        items.forEach(function (item) {
          item = self._craft(item.text, item.callback, item.shortcut);
          self.tpl.append(item.element);
        });
        self.tpl.show();
      }
      var x = 0,
          y = 0;
      if (position) {
        x = position.x;
        y = position.y;
      } else if (event) {
        y = event.clientY,
          x = event.clientX;
      }
      var mx = (eqUI.panel.tpl.width() + eqUI.panel.tpl.offset().left) - (self.tpl.width() + 15);
      if (x > mx) {
        x = mx;
      }
      var my = (eqUI.panel.tpl.height() + eqUI.panel.tpl.offset().top) - (self.tpl.height() + 15);
      if (y > my) {
        y = my;
      }
      self.tpl.css('top', y + 'px').css('left', x + 'px');
      eqUI.animate.circle(self.tpl);
      _.delay(function () {
        $('body').on('click', self._autoclose);
      }, 50);
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
          eqUI._scrollbar.update(dropdown[0]);
        });
      }
    };
    self.dropdown.close = function () {
      if (self.dropdownState === 'opened') {
        dropdown.removeClass('eqftp-header__dropdown_active');
        dropdownItemsHolder.slideUp(80, function () {
          self.dropdownState = 'closed';
          eqUI._scrollbar.update(dropdown[0]);
        });
      }
    };
    self.dropdown.resetItems = function () {
      self.items = [];
      dropdownItemsHolder.html('');
      eqUI._scrollbar.update(dropdown[0]);
    };
    self.dropdown.addItem = function (item) {
      dropdownItemsHolder.append(self.getItem(item));
      eqUI._scrollbar.update(dropdown[0]);
    };
    self.dropdown.setItems = function (items) {
      if (_.isArray(items)) {
        self.dropdown.resetItems();
        items.forEach(function (item) {
          self.dropdown.addItem(item);
        });
      }
    }
    self._autoclose = function (e) {
      if (!$(e.target).is(self.tpl) && $(e.target).closest(self.tpl).length < 1) {
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
      eqUI._scrollbar.update(dropdown[0]);
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
    self.title = new function () {
      var title = this;
      title._default = strings.eqftp__tab__fileTree__title;
      title._current = title._default;
      title.set = function (text) {
        title._current = text || title._default;
        eqUI.panel.title.update();
      }
    }();
    self.add = function (object, path) {
      if (!_.isString(path)) {
        return false;
      }
      if (!_.isArray(object)) {
        object = [object];
      }
      var parent = false;
      if (!_.isEmpty(self._rendered)) {
        parent = self.tpl.find('div[id="' + path + '"] .eqftp-fileTree__children');
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
              if (_.has(eqFTP, '_settings.main.date_format')) {
                format = eqFTP._settings.main.date_format;
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
            return 'eqftp.download(\'' + element.id + '\', \'' + element.fullPath + '\', true, [...arguments][0]);';
          },
          cmd_openFolder: function () {
            return 'eqftp.openFolder(\'' + element.id + '\', \'' + element.fullPath + '\');';
          }
        }))));
      });
      self.itemOpen(path);
    };
    self.itemOpen = function (path) {
      var el = self.tpl.find('div[id="' + path + '"]'),
          ch = el.find('.eqftp-fileTree__children:first');
      if (!ch.is(':visible')) {
        el.find('.eqftp-fileTree__info:first .eqftp-fileTree__icon .material-icons').text('keyboard_arrow_down');
        ch.slideDown(200, function () {
          if (eqUI.ps) {
            eqUI._scrollbar.update($('.eqftp-content__page_file-tree')[0]);
          }
        });
      }
    };
    self.itemClose = function (path) {
      var el = self.tpl.find('div[id="' + path + '"]'),
          ch = el.find('.eqftp-fileTree__children:first');
      if (ch.is(':visible')) {
        el.find('.eqftp-fileTree__info:first .eqftp-fileTree__icon .material-icons').text('keyboard_arrow_right');
        ch.slideUp(200, function () {
          if (eqUI.ps) {
            eqUI._scrollbar.update($('.eqftp-content__page_file-tree')[0]);
          }
        });
      }
    };
    self.itemToggle = function (path) {
      var el = self.tpl.find('div[id="' + path + '"]'),
          ch = el.find('.eqftp-fileTree__children:first');
      if (ch.is(':visible')) {
        el.find('.eqftp-fileTree__info:first .eqftp-fileTree__icon .material-icons').text('keyboard_arrow_right');
        ch.slideUp(200, function () {
          if (eqUI.ps) {
            eqUI._scrollbar.update($('.eqftp-content__page_file-tree')[0]);
          }
        });
      } else {
        el.find('.eqftp-fileTree__info:first .eqftp-fileTree__icon .material-icons').text('keyboard_arrow_down');
        ch.slideDown(200, function () {
          if (eqUI.ps) {
            eqUI._scrollbar.update($('.eqftp-content__page_file-tree')[0]);
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
          eqUI._scrollbar.add(self.tpl[0]);
          self._hasPs = true;
          self.tpl[0].scrollTop = self.tpl[0].scrollHeight;
          eqUI._scrollbar.update(self.tpl[0]);
        }
      }
    };
    self.close = function () {
      if (self.state === 'opened') {
        self.footer.removeClass('eqftp-footer_active');
        self.state = 'closed';
        if (self._hasPs) {
          eqUI._scrollbar.remove(self.tpl[0]);
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
      if (self.tpl.find('.eqftp-footer__item').length > 1000) {
        self.tpl.find('.eqftp-footer__item:first').remove();
      }
      if (self._hasPs) {
        self.tpl[0].scrollTop = self.tpl[0].scrollHeight;
        eqUI._scrollbar.update(self.tpl[0]);
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
    self.queueElements = {};
    self._clearAllButton = self.tpl.find("#eqftp-queue__clear_all");
    self._clearAllButton.hide();
    self.title = new function () {
      var title = this;
      title._default = strings.eqftp__tab__queue__title;
      title._current = title._default;
      title.set = function (text) {
        title._current = text || title._default;
        eqUI.panel.title.update();
      }
    }();
    self._gen = function (v) {
      return $(Mustache.render(require("text!htmlContent/queueElement.html"), _.defaults(_.clone(strings), {
        qid: v.qid,
        eqid: function () {
          return 'eqftp-queue-' + v.qid;
        },
        class: function () {
          return ((v.queue === 'f') ? 'eqftp-queue__item_error' : '');
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
          (self.queueElements[v.qid] || $('#eqftp-queue-' + v.qid)).remove();
          _.unset(self.queueElements, v.qid);
        }
      });
      add.forEach(function (v, i) {
        if (v.act === 'download' || v.act === 'upload') {
          self.tpl.append(self._gen(v));
          _.set(self.queueElements, v.qid, $('#eqftp-queue-' + v.qid));
        }
      });
      change.forEach(function (v, i) {
        if (!_.isEqual(self.have[_.findIndex(self.have, {
          qid: v.qid
        })], v)) {
          $('#eqftp-queue-' + v.qid).replaceWith(self._gen(v));
          _.set(self.queueElements, v.qid, $('#eqftp-queue-' + v.qid));
        }
      });
      self.have = items;
      if (self.have.length < 1) {
        self._clearAllButton.hide();
      } else {
        self._clearAllButton.show();
      }
    };
    self._setTotal = false;
    self.progress = function (data) {
      if (!self._setTotal) {
        self._setTotal = _.throttle(function (data) {
          var el = (self.queueElements[data.queuer.qid] || $('#eqftp-queue-' + data.queuer.qid));
          if (el.length < 1) {
            return false;
          }
          el.find('.eqftp-placeholder-size').text(utils.filesize_format(data.total, 1, localeSizes));
        }, 1000);
      }
      var el = (self.queueElements[data.queuer.qid] || $('#eqftp-queue-' + data.queuer.qid)),
          p = Math.floor(data.percents * 100);
      if (el.length < 1) {
        return false;
      }
      if (p > 100) {
        p = 100; //sometimes it may get to 101% because of shitty code (we just sum chunk sizes lol)
      }
      el.find('.eqftp__progressBar:first').css('width', p + '%');
      self._setTotal(data);
    };
    self.get = function () {
      return self.tpl;
    };
  }();

  eqUI.connections = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-connections');
    self.items = [];
    self.title = new function () {
      var title = this;
      title._default = strings.eqftp__tab__connections__title;
      title._current = title._default;
      title.set = function (text) {
        title._current = text || title._default;
        eqUI.panel.title.update();
      }
    }();
    self.editor = new function () {
      var connections = self,
          self = this;
      self.tpl = eqUI.panel.tpl.find('.eqftp-modal_connectionsSettings');
      self.state = 'closed';
      
      self._title = self.tpl.find('.eqftp__title .eqftp__titleNowrap');
      self._removeBtn = self.tpl.find('#eqftpConnectionSaveBtn');
      
      self.protocolSelector = function (target) {
        eqUI.context.open([
          {
            text: "FTP",
            callback: function () {
              if (_.isjQuery(target)) {
                target.val('ftp').change();
              }
            },
            shortcut: ""
          },
          {
            text: "SFTP",
            callback: function () {
              if (_.isjQuery(target)) {
                target.val('sftp').change();
              }
            },
            shortcut: ""
          }
        ], {
          x: (_.isjQuery(target) ? target.offset().left : 0),
          y: (_.isjQuery(target) ? (target.offset().top + target.outerHeight()) : 0)
        }, target);
      };
      var activeClass = 'eqftp-modal_active';
      self._cached = {};
      self._cache = function () {
        self._cached = JSON.stringify(self.read());
      };
      self.tpl.find('#eqftpConnectionProtocol').on('change', function () {
        var protocol = $(this).val();
        switch (protocol) {
          case 'ftp':
            $('[data-specific="sftp"]').hide();
            $('[data-specific="ftp"]').show();
            break;
          case 'sftp':
            $('[data-specific="ftp"]').hide();
            $('[data-specific="sftp"]').show();
            break;
          default:
            $('[data-specific="sftp"]').hide();
            $('[data-specific="ftp"]').hide();
            break;
        }
      });
      self.open = function (callback) {
        if (self.state === 'closed') {
          self.tpl.addClass(activeClass);
          self.state = 'opened';
          eqUI._scrollbar.add(self.tpl.find('.eqftp-modal__content:first')[0]);
          if (_.isFunction(callback)) {
            callback();
          }
        }
      };
      self.close = function (callback) {
        var close = _.once(function () {
          if (self.state === 'opened') {
            self.tpl.removeClass(activeClass);
            self.state = 'closed';
            eqUI._scrollbar.remove(self.tpl.find('.eqftp-modal__content:first')[0]);
          }
          if (_.isFunction(callback)) {
            callback();
          }
        });
        if (JSON.stringify(self.read()) !== self._cached) {
          eqUI.dialog.new({
            title: strings.eqftp__dialog__connection_editing_unsaved_title,
            text: strings.eqftp__dialog__connection_editing_unsaved_text,
            action1: strings.eqftp__controls__dismiss,
            action2: strings.eqftp__controls__back
          }, function (result) {
            if (result) {
              close();
            }
          });
          return false;
        }
        close();
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
        self.tpl.find('[eqftp-id]').hide();
        self.tpl.find('input, select, textarea').each(function () {
          setInputNameValue($(this));
        });
      };
      self.read = function () {
        var r = {};
        self.tpl.find('input, select, textarea').each(function () {
          var p = getInputNameValue($(this));
          if (p) {
            _.set(r, p.name, p.value);
          }
        });
        return r;
      };
      self.edit = function (connection, openCallback) {
        if (!openCallback && event) {
          openCallback = function () {
            eqUI.animate.shutter(self.tpl, $(event.target).closest('.eqftp-connections__item'));
          }
        }
        self.reset();
        
        self._title.text(strings.eqftp__cs__window_title_new);
        self._removeBtn.text(strings.eqftp__controls__create);
        
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
            setInputNameValue(c, value);
          });
          if (connection.id) {
            self._title.text(strings.eqftp__cs__window_title_edit);
            self._removeBtn.text(strings.eqftp__controls__save);
            self.tpl.append('<input name="id" type="hidden" value="' + (connection.id || '') + '"/>');
            self.tpl.find('[eqftp-id]').attr('eqftp-id', (connection.id || '')).show();
          }
        }
        self._cache();
        self.open(openCallback);
      };
      self.new = function () {
        return self.edit({
          autoupload: true,
          check_difference: true
        }, function () {
          eqUI.animate.circle(self.tpl, $(event.target).closest('.eqftp__button'));
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
          //_c.push(_.defaultsDeep(connections.settings[i], (connections.credentials[i] || {})));
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

  eqUI.settings = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-content__page_settings');
    self.masterPassword = self.tpl.find('#eqftpMasterPasswordHolder');
    self.masterPassword.hide();
    self.tpl.find('#eqftpSettingFileEncrypt').on('change', function () {
      if ($(this).is(':checked')) {
        self.masterPassword.show();
      } else {
        self.masterPassword.hide();
      }
    });
    self.title = new function () {
      var title = this;
      title._default = strings.eqftp__tab__settings__title;
      title._current = title._default;
      title.set = function (text) {
        title._current = text || title._default;
        eqUI.panel.title.update();
      }
    }();
    self.set = function (settings) {
      if (!_.isObject(settings)) {
        return false;
      }
      _.forOwn(settings, function (value, name) {
        var el = self.tpl.find('[name="' + name + '"]');
        setInputNameValue(el, value);
      });
    };
    self.get = function () {
      var r = {};
      self.tpl.find('[name]').each(function () {
        var _r = getInputNameValue($(this));
        if (_r) {
          _.set(r, _r.name, _r.value);
        }
      });
      return r;
    };
  }();

  eqUI.password = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-modal_password');
    var pass = self.tpl.find('[name="password"]');
    self.tpl.hide();
    self.state = 'hidden';
    self._callback = function () {};
    self._button = self.tpl.find('#eqftpDecrypt');
    self._input = self.tpl.find('#eqftpPassword');
    self.show = function (callback) {
      self._button.off('click', self._callback);
      if (self.state === 'hidden') {
        self.tpl.show();
        self.state = 'shown';
      }
      if (eqUI.panel.state === 'opened') {
        self._input.focus();
      }
      self._callback = function () {
        var p = pass.val();
        pass.val('');
        self.hide();
        if (_.isFunction(callback)) {
          callback(p);
        }
        self._button.off('click', self._callback);
      };
      self._button.on('click', self._callback);
    };
    self.hide = function () {
      if (self.state === 'shown') {
        self.tpl.hide();
        self.state = 'hidden';
      }
    };
  }();

  eqUI.welcome = new function () {
    var self = this;
    self.tpl = eqUI.panel.tpl.find('.eqftp-modal_welcome');
    self.tpl.hide();
    self.state = 'hidden';
    self.show = function () {
      if (self.state === 'hidden') {
        self.tpl.show();
        self.state = 'shown';
      }
    };
    self.hide = function () {
      if (self.state === 'shown') {
        self.tpl.hide();
        self.state = 'hidden';
      }
    };
    self.toggle = function () {
      if (self.state === 'hidden') {
        self.tpl.show();
      } else {
        self.tpl.hide();
      }
    };
  }();

  eqUI.explorer = new function () {
    var self = this;
    self.saveFile = function (title, start, filename, callback) {
      FileSystem.showSaveDialog(title, start, filename, callback);
    };
    self.openFile = function (title, start, callback) {
      FileSystem.showOpenDialog(false, false, title, start, null, function (error, result) {
        if (error) {
          // Error / Cancel
          callback(error, result);
        } else {
          // Okay
          if (_.isArray(result)) {
            result = result[0];
          }
          callback(error, result);
        }
      });
    };
    self.openFolder = function (title, start, callback) {
      FileSystem.showOpenDialog(false, true, title, start, null, function (error, result) {
        if (error) {
          // Error / Cancel
          callback(error, result);
        } else {
          // Okay
          if (_.isArray(result)) {
            result = result[0];
          }
          callback(error, result);
        }
      });
    };
  }();

  eqUI.dialog = new function () {
    var self = this;
    self.tpl = require("text!htmlContent/dialogElement.html");
    self.new = function (params, callback) {
      if (!callback) {
        callback = function () {};
      }
      var dialog = $(Mustache.render(self.tpl, _.defaults(params, {
        action1: strings.eqftp__controls__ok,
        action2: strings.eqftp__controls__cancel
      })));
      eqUI.panel.get().prepend(dialog);
      var once = _.once(function (e) {
        var action = $(this).attr('eqftp-button');
        switch (action) {
          case 'action1':
            callback(true);
            break;
          case 'action2':
            callback(false);
            break;
        }
        dialog.remove();
      });
      dialog.find('[eqftp-button]').on('click', once);
    };
  }();

  eqUI.toast = new function () {
    var self = this;
    self.tpl = eqUI.panel.p.filter('.eqftp-toast');
    $('body').append(self.tpl);
    self.elementTpl = require("text!htmlContent/toastElement.html");
    self.current = {};
    self._craft = function (_p) {
      if (!_p) {
        _p = {};
      }
      var toast = new function () {
        var toast = this;
        toast.element = $(Mustache.render(self.elementTpl, _.defaults(_p, strings)));
        toast.btn = toast.element.find('.eqftp-toast__action');
        toast.group = _p.group;
        toast.type = _p.type;
        toast.id = utils.uniq();
        toast.num = _p.num;
        toast.callback = _.once(function () {
          toast.remove();
          if (_.isFunction(_p.callback)) {
            _p.callback();
          }
        });
        toast.remove = function () {
          toast.clearTimeout();
          if (toast.element.length > 0) {
            toast.element.remove();
          }
          if (_.isFunction(_p.callback)) {
            toast.btn.off('click', toast.callback);
          }
          _.unset(self.current, [toast.type, toast.id]);
        };
        toast.replaceWith = function (newToast) {
          if (!_.isjQuery(newToast)) {
            toast.element.replaceWith(newToast.element);
          } else {
            toast.element.replaceWith(newToast);
          }
          toast.remove();
        };
        toast.clearTimeout = function () {
          if (toast._timeout) {
            clearTimeout(toast._timeout);
            toast._timeout = undefined;
          }
        };
        toast._timeout = _.delay(toast.remove, 10000);
      }();
      _.set(self.current, [toast.type, toast.id], toast);
      return toast;
    }
    // group - [connection|queue|etc...]
    // type - [info|request]
    self.new = function (params, group, type) {
      if (!_.isObject(params)) {
        return false;
      }
      if (!_.has(params, 'string')) {
        return false;
      }
      if (['info', 'request'].indexOf(type) < 0) {
        return false;
      }
      if (!group) {
        group = 'default';
      }
      params.id = 'eqftp-toast-' + utils.uniq();
      var _p = {
        text: (strings[params.string] || params.string),
        num: 1
      };
      var f = false,
          current = false;
      if (group !== 'default' && type === 'info' && self.current[type]) {
        //stackacble
        f = _.findKey(self.current[type], ['group', group]);
        if (f) {
          current = self.current[type][f];
          _p.text = (strings[params.string + '_m'] || params.string);
          _p.num = (current.num || _p.num) + 1;
        }
      } else if (type === 'request') {
        _p.action = strings[params.button.text] || params.button.text;
        _p.callback = params.button.callback;
      }
      _p.text = Mustache.render(_p.text, _.defaults({
        num: _p.num
      }, params));
      _p.group = group;
      _p.type = type;
      var toast = self._craft(_p);
      if (type === 'info') {
        toast.btn.hide();
        if (current) {
          current.replaceWith(toast);
        } else {
          self.tpl.append(toast.element);
        }
      } else if (type === 'request') {
        toast.btn.on('click', toast.callback);
        self.tpl.append(toast.element);
      }
    };
  }();

  eqUI.animate = {
    _speed: 250,
    _speedRanges: [
      {
        max: 200,
        speed: 80
      },
      {
        max: 500,
        speed: 160
      },
      {
        max: 1000,
        speed: 300
      }
    ],
    _speedAdapt: function (size) {
      var f = _.findIndex(eqUI.animate._speedRanges, function (o) {
        return o.max > size;
      });
      if (f > -1) {
        eqUI.animate._speed = eqUI.animate._speedRanges[f].speed;
        console.log(size, eqUI.animate._speed);
      }
    },
    shutter: function (targetElement, fromElement) {
      if (!targetElement || !fromElement) {
        return false;
      }
      fromElement = $(fromElement);
      var x = fromElement.offset().left - targetElement.offset().left,
          y = fromElement.offset().top - targetElement.offset().top,
          fw = fromElement.width(),
          fh = fromElement.height(),
          w = targetElement.width(),
          h = targetElement.height();
      var cache = {};
      var toCache = [
        '-webkit-clip-path',
        'transition-timing-function',
        'transition'
      ];
      toCache.forEach(function (v) {
        cache[v] = targetElement.css(v);
      });
      var x0 = 0,
          y0 = (y + (fh / 2)),
          x1 = fw,
          y1 = (y + (fh / 2)),
          x2 = fw,
          y2 = (y + (fh / 2)),
          x3 = 0,
          y3 = (y + (fh / 2));
      var nx0 = 0,
          ny0 = 0,
          nx1 = w,
          ny1 = 0,
          nx2 = w,
          ny2 = h,
          nx3 = 0,
          ny3 = h;
      var size = (ny3 - ny0) - (y3 - y0);
      eqUI.animate._speedAdapt(size);
      targetElement
        .css('-webkit-clip-path', 'polygon(' + x0 + 'px ' + y0 + 'px, ' +
             x1 + 'px ' + y1 + 'px, ' +
             x2 + 'px ' + y2 + 'px, ' +
             x3 + 'px ' + y3 + 'px)'
            )
        .css('transition-timing-function', 'cubic-bezier(0.4, 0.0, 0.2, 1)')
        .css('transition', '-webkit-clip-path ' + (eqUI.animate._speed / 1000) + 's');
      _.delay(function () {
        targetElement
          .css('-webkit-clip-path', 'polygon(' + nx0 + 'px ' + ny0 + 'px, ' +
               nx1 + 'px ' + ny1 + 'px, ' +
               nx2 + 'px ' + ny2 + 'px, ' +
               nx3 + 'px ' + ny3 + 'px)'
              );
        _.delay(function () {
          toCache.forEach(function (v) {
            targetElement.css(v, cache[v]);
          });
        }, eqUI.animate._speed);
      }, 10);
    },
    circle: function (targetElement, fromElement) {
      if (!targetElement) {
        return false;
      }
      if (fromElement) {
        fromElement = $(fromElement);
        var d = fromElement.width(),
            x = fromElement.offset().left - targetElement.offset().left + (d / 2),
            y = fromElement.offset().top - targetElement.offset().top + (d / 2),
            sc = fromElement.css('background-color');
      } else if (event) {
        var d = 10,
            x = event.clientX - targetElement.offset().left,
            y = event.clientY - targetElement.offset().top;
      } else {
        return false;
      }
      var w = targetElement.width(),
          h = targetElement.height(),
          nd = ((w > h) ? w : h),
          size = (nd - d);
      eqUI.animate._speedAdapt(size);
      var filler = false;
      var cache = {};
      var toCache = [
        '-webkit-clip-path',
        'transition'
      ];
      toCache.forEach(function (v) {
        cache[v] = targetElement.css(v);
      });
      if (sc) {
        filler = $('<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 300;"></div>');
        filler.css('background-color', sc);
        targetElement.prepend(filler);
      }
      targetElement
        .css('-webkit-clip-path', 'circle(' + d + 'px at ' + x + 'px ' + y + 'px)')
        .css('transition-timing-function', 'cubic-bezier(0.4, 0.0, 0.2, 1)')
        .css('transition', '-webkit-clip-path ' + (eqUI.animate._speed / 1000) + 's');
      _.delay(function () {
        if (filler) {
          filler.fadeOut(eqUI.animate._speed, function () {
            filler.remove();
          });
        }
        targetElement.css('-webkit-clip-path', 'circle(' + nd + 'px at ' + x + 'px ' + y + 'px)');
        _.delay(function () {
          toCache.forEach(function (v) {
            targetElement.css(v, cache[v]);
          });
        }, eqUI.animate._speed);
      }, 10);
    }
  };

  eqUI._dragndrop = new function () {
    var self = this;
    self.new = function (moveCallback, upCallback, handler) {
      var previousPosition = {};
      var mcb = function (event) {
        if (!_.isEmpty(previousPosition)) {
          var dx = event.clientX - previousPosition.x;
          var dy = event.clientY - previousPosition.y;
          moveCallback(dx, dy, event);
        }
        previousPosition = {
          x: event.clientX,
          y: event.clientY
        };
      };
      if (!upCallback || !_.isFunction(upCallback)) {
        upCallback = mcb;
      }
      if (!handler || !_.isjQuery(handler)) {
        handler = $('<div class="eqftp-resize"></div>');
      }
      handler.on('mousedown', function (event) {
        var up = function (event) {
          previousPosition = {};
          upCallback(...arguments);
          $('body').off('mousemove', mcb).off('mouseup', up);
        };
        $('body').on('mousemove', mcb).on('mouseup', up);
      });
      return handler;
    };
  }();
  eqUI._scrollbar = new function () {
    var self = this;
    self._current = [];
    
    self.add = function (element) {
      if (self._current.indexOf(element) < 0) {
        eqUI.ps.initialize(element);
        self._current.push(element);
      }
    }
    self.remove = function (element) {
      var i = self._current.indexOf(element);
      if (i > -1) {
        eqUI.ps.destroy(element);
        self._current.splice(i, 1);
      }
    }
    self.update = function (element) {
      if (self._current.indexOf(element) > -1) {
        eqUI.ps.update(element);
      }
    }
    
    $(window).on('resize', function () {
      self._current.forEach(function (element) {
        self.update(element);
      });
    });
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
