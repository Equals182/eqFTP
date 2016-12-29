(function () {});

(function () {


  var buildDefaultPatterns = function () {
    var fn = {
      d: 'format.leading_zero(this.date)',
      D: 'this.dayName.substr()',
      l: 'this.dayName',
      S: 'format.ordinalSuffix(this.date)',
      w: 'this.day',
      j: 'this.date',
      z: 'this.dayOfYear',
      W: 'this.weekNum',
      w: 'this.day',
      j: 'this.date',
      z: 'this.dayOfYear',
      W: 'this.weekNum',
      M: 'format.months[this.month - 1].substr(0, 3)',
      F: 'format.months[this.month - 1]',
      Y: 'this.year',
      a: 'this.am',
      A: 'this.am.toUpperCase()',
      y: '("" + this.year).substr(2, 2)',
      c: 'this.iso',
      m: 'format.leading_zero(this.month)',
      U: 'Math.round(this / 1000)',
      g: 'this.hours12',
      G: 'format.leading_zero(hours12)',
      h: 'this.hours',
      H: 'format.leading_zero(this.hours)',
      i: 'format.leading_zero(this.min)',
      s: 'format.leading_zero(this.sec)'
    };

    for (var pattern_name in fn) {
      if (fn.hasOwnProperty(pattern_name)) {
        fn[pattern_name] = new Function('format', 'return ' + fn[pattern_name]);
      }
    }
    return fn;

  };

  var buildRegExp = function (fn) {
    var v = [];

    Object.keys(fn).forEach(function (k) {
      v.push('(\\\\)?' + k);
    });

    return new RegExp(v.join('|'), 'g');
  };

  var format = function (date, fmt) {

    if (date == undefined || fmt == undefined) {
      return '';
    }

    date = format.dateToObject(date);

    return fmt.replace(format.regexp, function (k) {
      if (format.fn[k]) return format.fn[k].call(date, format);
      return k.replace('\\', '');
    });
  };


  format.fn = buildDefaultPatterns();
  format.regexp = buildRegExp(format.fn);

  /** Receiving date, returning an object with various stuff regarding the date.*/
  format.dateToObject = function (d) {
    var fd = new Date(d.getFullYear(), 0, 1),
      date = {
        date: d.getDate(),
        year: d.getFullYear(),
        hours: d.getHours(),
        day: d.getDay(),
        min: d.getMinutes(),
        sec: d.getSeconds(),
        month: d.getMonth() + 1,
        iso: d.toISOString()
      };

    date.dayName = format.days[date.day];
    date.am = date.hours < 12 ? 'am' : 'pm';
    date.hours12 = date.hours % 12;
    date.hours12 = date.hours12 > 0 ? date.hours12 : 12;
    date.dayOfYear = Math.round((d - fd) / 8.64e7);
    date.weekNum = Math.ceil((((d - fd) / 8.64e7) + fd.getDay() - 1) / 7);
    return date;
  }

  format.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  format.months = [
    'January', 'February', 'March', 'April', 'May',
    'June', 'Jule', 'August', 'September', 'October',
    'November', 'December'
  ];

  /** Number ordinal suffix (C) Dave Furfero as seen on https://gist.github.com/furf/986113#file-annotated-js */

  format.ordinalSuffix = function (n) {
    return ["th", "st", "nd", "rd"][(n = ~~ (n < 0 ? -n : n) % 100) > 10 && n < 14 || (n %= 10) > 3 ? 0 : n];
  };

  /** Calling this will add .format function to all Date objects */
  format.extendPrototype = function () {
    Date.prototype.format = function (s) {
      return format(this, s);
    };
    return this;
  };

  /** Leading zero for two and one-digit numbers (only!) */
  format.leading_zero = function (num) {
    num = "00" + num;
    return num.substr(num.length - 2);
  };

  // Exporting with no-condlifct and nodeJS
  (function (lib, lib_name) {

    lib.noConflict = function () {
      return lib;
    };

    if (typeof window !== 'undefined') {

      lib.noConflict = function () {
        delete window[lib_name];
        return lib;
      };

      if (window[lib_name]) {
        var prev_state = window[lib_name];
        lib.noConflict = function () {
          window[lib_name] = prev_state;
          delete window[lib_name];
          return lib;
        }
      }
      
      window[lib_name] = lib;
    } else if (module) {
      module.exports = lib;
    }

  })(format, 'date_format');



})();