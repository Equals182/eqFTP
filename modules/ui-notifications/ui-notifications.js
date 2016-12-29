"use strict";
;(function (root, factory) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = exports = factory();
  }
  else if (typeof define === "function" && define.amd) {
    // AMD
    define([], factory);
  }
  else {
    // Global (browser)
    root.eqNotify = factory();
  }
}(this, function () {
  var eqNotify = {
    new: function (params) {
      var tpl = '<div class="eqNotify eqNotify--{{type}}">' +
                    '<div class="eqNotify__info">' +
                        '<div class="eqNotify__title">{{title}}</div>' +
                        '<div class="eqNotify__text">{{text}}</div>' +
                    '</div>' +
                    '<div class="eqNotify__icon">' +
                        '<i class="fa fa-{{icon}}"></i>' +
                    '</div>' +
                '</div>';
      if (params.variables) {
        params.variables.forEach(function (v, i) {
          tpl = tpl.replace('{{'+v.name+'}}', v.value);
        });
      }
      
      if (!params.type) {
        params.type = 'info';
      }
      tpl = tpl.replace('{{type}}', params.type);
      
      if (!params.parent) {
        params.parent = $('body');
      }
      var element = $(tpl);
      params.parent.append(element);
    }
  };
  return eqNotify;
}));