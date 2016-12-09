/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */
/*global $, define, brackets */

define(function (require, exports, module) {
  "use strict";
  var Mustache = brackets.getModule("thirdparty/mustache/mustache"),
      strings = require("strings"),
      _ = require("../node/node_modules/lodash/lodash"),
      eqUI = this;
  
  eqUI.events = function (event) {
    if (!event) {
      return false;
    }
    if (event.action) {
      switch (event.action) {
        case 'ready:html':
          // Appending eqFTP button on toolbar
          $("#main-toolbar .buttons").append(eqUI.toolbarIcon.get());
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
  
  eqUI.dropdown = new function () {
    var self = this;
    self.tpl = $(Mustache.render(require("text!htmlContent/dropdown.html"), strings));
    var dropdownItemsHolder = self.tpl.find('.eqftp-panel__server_dropdown_holder');
    self.state = 'closed';
    self.items = [];
    
    self.resetItems = function () {
      self.items = [];
      dropdownItemsHolder.html('');
    };
    self.addItem = function (item) {
      dropdownItemsHolder.append(self.getItem(item));
    };
    self.toggle = function () {
      if (self.state === 'opened') {
        self.close();
      } else {
        self.close();
      }
    };
    self.open = function () {
      if (self.state === 'closed') {
        dropdownItemsHolder.slideDown(80, function () {
          self.state = 'opened';
        });
      }
    };
    self.close = function () {
      if (self.state === 'opened') {
        dropdownItemsHolder.slideUp(80, function () {
          self.state = 'closed';
        });
      }
    };
    self.filter = function (keyword) {
      if (keyword) {
        if (self.eqftp) {
          keyword = self.eqftp.utils.escapeRegExp(keyword);
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
    self.tpl = $(Mustache.render(require("text!htmlContent/fileTree.html"), strings));
    
    self.add = function (object, parent) {
      if (_.isArray(object)) {
        object.forEach(function (o) {
          self.add(o, parent);
        });
      } else if (_.isObject(object)) {
        var ul = self.tpl.children('ul');
        if (parent && parent !== '/') {
          ul = ul.find('[id="' + parent + '"]').find('ul:first');
        }
        ul.append($(Mustache.render(require("text!htmlContent/fileTreeElement.html"), _.defaults(_.clone(strings), object, {
          customDate: 'test'
        }))));
        if (!ul.is(':visible')) {
          ul.slideDown(100);
        }
      }
    };
    self.get = function () {
      return self.tpl;
    }
  };
  
  eqUI.panel = new function () {
    var self = this;
    self.state = 'closed';
    self.tpl = $(Mustache.render(require("text!htmlContent/panel.html"), strings));
    
    self.open = function () {
      if (self.state === 'closed') {
        self.tpl.show();
        $("body > .main-view > .content").animate({
          right: '330px'
        }, 200, function () {
          self.state = 'opened';
        });
        self.tpl.animate({
          width: '300px'
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
          width: '0px'
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
    
    var dropdownHolder = self.tpl.find('.eqftp-panel__dropdown_holder:first');
    dropdownHolder.append(eqUI.dropdown.get());
    self.tpl.find('.eqftp-file_tree--holder').replaceWith(eqUI.fileTree.get());
    
    self.get = function () {
      return self.tpl;
    };
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