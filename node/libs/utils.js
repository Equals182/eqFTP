/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true */
/*jslint white: true */
/*global $ */

(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("lodash"));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["node/node_modules/lodash/lodash"], factory);
	}
	else {
		// Global (browser)
		root.eqUtils = factory();
	}
}(this, function (_) {
  "use strict";

  if (!_) {
    _ = require("lodash");
  }
  
  var _uniq;
  var eqUtils = {
    _: _,
    parseQuery: function (str) {
      var query = {};
      var a = str.substr(1).split('&');
      var i = 0;
      for (i; i < a.length; i++) {
        var b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
      }
      return query;
    },
    chain: function () {
      var functions = Array.prototype.slice.call(arguments, 0);
      if (functions.length > 0) {
        var firstFunction = functions.shift(),
            firstPromise = firstFunction.call();
        firstPromise.done(function () {
          eqUtils.chain.apply(null, functions);
        });
      }
    },
    uniq: function () {
      var n = Date.now(),
          suf = '';
      if (!_uniq) {
        _uniq = {
          n: n,
          suffix: 0
        };
      } else {
        if (_uniq.n && _uniq.n === n) {
          _uniq.suffix++;
          suf = _uniq.suffix;
        } else {
          _uniq.suffix = 0;
        }
      }
      return n.toString(32) + suf;
    },
    escapeRegExp: function (str, exceptions) {
      var to_delete = ['-', '[', ']', '/', '{', '}', '(', ')', '*', '+', '?', '.', '\\', '^', '$', '|', '!'];
      if (!exceptions) {
        exceptions = [];
      } else {
        if (!_.isArray(exceptions)) {
          if (_.isString(exceptions)) {
            exceptions = exceptions.split(',');
          } else {
            exceptions = [];
          }
        }
      }
      exceptions.forEach(function (v, i) {
        v = v.trim();
        var found = _.indexOf(to_delete, v);
        if (found > -1) {
          to_delete.splice(found, 1);
        }
      });
      to_delete.forEach(function (v, i) {
        to_delete[i] = '\\' + v;
      });
      to_delete = to_delete.join('');
      return str.replace(new RegExp('[' + to_delete + ']', 'g'), "\\$&");
    },
    normalize: function (path) {
      if (_.isString(path)) {
        return path.replace(/\\+/g, '/').replace(/\/\/+/g, '/');
      }
      return path;
    },
    parseConnectionString: function (str) {
      if (!str || !_.isString(str)) {
        return false;
      }
      //var m = str.match(/((ftp|sftp):\/\/)?((.*?)(:(.*?))?@)?([A-Z\.\-\_a-z0-9]+)(:(\d+))?/i);
      /*
      ** $2 - protocol
      ** $4 - login
      ** $6 - password
      ** $7 - domain
      ** $9 - port
      */
      var m = str.match(/((ftp|sftp):\/\/)?([^\s:]*)(:(.*))?@([^:\s]*)(:(.*))?/i);
      /*
      ** $2 - protocol
      ** $3 - login
      ** $5 - password
      ** $6 - domain
      ** $8 - port
      */
      if (!m) {
        return false;
      }
      if (!m[3] || !m[6]) {
        return false;
      }
      return {
        protocol: m[2],
        login: m[3],
        password: m[5],
        server: m[6],
        port: m[8]
      };
    },
    getNamepart: function (filename, part) {
      if (!_.isString(filename)) {
        return filename;
      }
      var m = filename.match(/((\/?.*?\/)*)(((.*)\.)?(.*))/);
      if (!m) {
        return filename;
      }
      switch (part) {
        case 'parentPath':
          return m[1];
          break;
        case 'parent':
        case 'parentName':
          return (m[2]?m[2].replace('/', ''):'');
          break;
        case 'name':
        case 'filename':
        default:
          return m[3];
          break;
        case 'name_noext':
        case 'filename_noext':
        case 'name_noextension':
        case 'filename_noextension':
          return (m[5] || m[6]);
          break;
        case 'extension':
        case 'ext':
          return (m[5] ? m[6] : '');
          break;
      }
    },
    filesize_format: function (value, decimals, sizes) {
      if (!decimals) {
          decimals = 1;
      }
      if (value === 0) { return '0 ' + sizes[0]; }
      var k = 1000, // or 1024 for binary
          dm = decimals + 1 || 3,
          i = Math.floor(Math.log(value) / Math.log(k));
      return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    date_format: function (date, format) {
      Date.shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      Date.longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      Date.shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      Date.longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // defining patterns
      var replaceChars = {
          // Day
          d: function() { return (date.getDate() < 10 ? '0' : '') + date.getDate(); },
          D: function() { return Date.shortDays[date.getDay()]; },
          j: function() { return date.getDate(); },
          l: function() { return Date.longDays[date.getDay()]; },
          N: function() { return (date.getDay() == 0 ? 7 : date.getDay()); },
          S: function() { return (date.getDate() % 10 == 1 && date.getDate() != 11 ? 'st' : (date.getDate() % 10 == 2 && date.getDate() != 12 ? 'nd' : (date.getDate() % 10 == 3 && date.getDate() != 13 ? 'rd' : 'th'))); },
          w: function() { return date.getDay(); },
          z: function() { var d = new Date(date.getFullYear(),0,1); return Math.ceil((date - d) / 86400000); }, // Fixed now
          // Week
          W: function() {
              var target = new Date(date.valueOf());
              var dayNr = (date.getDay() + 6) % 7;
              target.setDate(target.getDate() - dayNr + 3);
              var firstThursday = target.valueOf();
              target.setMonth(0, 1);
              if (target.getDay() !== 4) {
                  target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
              }
              var retVal = 1 + Math.ceil((firstThursday - target) / 604800000);

              return (retVal < 10 ? '0' + retVal : retVal);
          },
          // Month
          F: function() { return Date.longMonths[date.getMonth()]; },
          m: function() { return (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1); },
          M: function() { return Date.shortMonths[date.getMonth()]; },
          n: function() { return date.getMonth() + 1; },
          t: function() {
              var year = date.getFullYear(), nextMonth = date.getMonth() + 1;
              if (nextMonth === 12) {
                  year = year++;
                  nextMonth = 0;
              }
              return new Date(year, nextMonth, 0).getDate();
          },
          // Year
          L: function() { var year = date.getFullYear(); return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)); },   // Fixed now
          o: function() { var d  = new Date(date.valueOf());  d.setDate(d.getDate() - ((date.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
          Y: function() { return date.getFullYear(); },
          y: function() { return ('' + date.getFullYear()).substr(2); },
          // Time
          a: function() { return date.getHours() < 12 ? 'am' : 'pm'; },
          A: function() { return date.getHours() < 12 ? 'AM' : 'PM'; },
          B: function() { return Math.floor((((date.getUTCHours() + 1) % 24) + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
          g: function() { return date.getHours() % 12 || 12; },
          G: function() { return date.getHours(); },
          h: function() { return ((date.getHours() % 12 || 12) < 10 ? '0' : '') + (date.getHours() % 12 || 12); },
          H: function() { return (date.getHours() < 10 ? '0' : '') + date.getHours(); },
          i: function() { return (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(); },
          s: function() { return (date.getSeconds() < 10 ? '0' : '') + date.getSeconds(); },
          u: function() { var m = date.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ?
      '0' : '')) + m; },
          // Timezone
          e: function() { return /\((.*)\)/.exec(new Date().toString())[1]; },
          I: function() {
              var DST = null;
                  for (var i = 0; i < 12; ++i) {
                          var d = new Date(date.getFullYear(), i, 1);
                          var offset = d.getTimezoneOffset();

                          if (DST === null) DST = offset;
                          else if (offset < DST) { DST = offset; break; }                     else if (offset > DST) break;
                  }
                  return (date.getTimezoneOffset() == DST) | 0;
              },
          O: function() { return (-date.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(date.getTimezoneOffset() / 60) < 10 ? '0' : '') + Math.floor(Math.abs(date.getTimezoneOffset() / 60)) + (Math.abs(date.getTimezoneOffset() % 60) == 0 ? '00' : ((Math.abs(date.getTimezoneOffset() % 60) < 10 ? '0' : '')) + (Math.abs(date.getTimezoneOffset() % 60))); },
          P: function() { return (-date.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(date.getTimezoneOffset() / 60) < 10 ? '0' : '') + Math.floor(Math.abs(date.getTimezoneOffset() / 60)) + ':' + (Math.abs(date.getTimezoneOffset() % 60) == 0 ? '00' : ((Math.abs(date.getTimezoneOffset() % 60) < 10 ? '0' : '')) + (Math.abs(date.getTimezoneOffset() % 60))); }, // Fixed now
          T: function() { return date.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); },
          Z: function() { return -date.getTimezoneOffset() * 60; },
          // Full Date/Time
          c: function() { return date.format("Y-m-d\\TH:i:sP"); }, // Fixed now
          r: function() { return date.toString(); },
          U: function() { return date.getTime() / 1000; }
      };

      return format.replace(/(\\?)(.)/g, function(_, esc, chr) {
          return (esc === '' && replaceChars[chr]) ? replaceChars[chr].call(date) : chr;
      });
    }
  };
  return eqUtils;
}));