date-format
===

A lightweight (~3 kb) function fo format date "like in PHP".

Also, not all of the php patterns are available (say, timezone-specific ones aren't!). If you need more complex
implementation you should probably use [this](http://phpjs.org/functions/date/) or
[this](https://github.com/jacwright/date.format) or probably something else (there's a plenty around, actually)

I needed a tiny date function to use with JS templates. Also I needed practice. So I wrote this.

Note that all the pattern values are calculated on execution. It's pretty quick as it is mostly just text manipulation,
but I thought you should probably be aware. Also the patterns are compiled into an ugly regex, which is then replaced with
values.

Installing
---

Install using bower:

    bower install date-format --save

And then add dateformat.js file to your page:

    <script type="text/javascript" src="bower_components/date-format/date-format.js">

Usage
---

There's a function called date_format in global scope (in browser). It accepts 2 parameters - the date object and the format string:

    var date = new Date('Feb 2, 2015 03:24:13');
    date_format(date, 'M j-S, Y'); // February 2-nd, 2015

### Date.format

The library can extend the Date.prototype with new method - format, which accepts a string of format. It is no longer happening because serious people insist that extending prototypes is for dummies and should be optional, and who am I to argue? :D

To extend the Date.prototype with format method - use `date_format.extendPrototype` function. Sure, you can call this multiple times, but better call it once :P

    date_format.extendPrototype();
    new Date('Feb 2, 2015 03:24:13').format('M j-S, Y');            
    new Date('Feb 2, 2015 03:24:13').format('j-S F of Y, g:i A');   //2-nd February of 2015, 3:24 AM

Supported identifiers
---

### Day

 - `d` - day of month with leading zeros (01 to 31)
 - `j` - day of month without leading zeros (1 to 31)
 - `S` - day month suffix. (th, st, nd or rd)
 - `z` - day of year (1 to 365)

### Week

 - `D` - three-symbol week day name (Mon to Sun)
 - `l` - full week day name (Monday to Sunday)
 - `w` - week day (1 to 7)
 - `W` - number of week. Weeks starting from monday. (1 to 53)

### Month 

 - `m` - Month number with leading zeros (01 to 12)
 - `M` - Three-symbol month name (Jan to Dec)
 - `F` - Full month name (January to December)

### Year

 - `Y` - Full year number (for example, 2015)
 - `y` - Last two digits of year (for example, 15)

### Time

 - `g` - Hours in 12-hour format (1 to 12)
 - `G` - Hours in 12-hour format with leading zeros (01 to 12)
 - `h` - Hours in 24-hour format (0 to 23)
 - `H` - Hours in 24-hour format with leading zeros (01 to 23)
 - `i` - Minutes with leading zeros (00 to 59)
 - `s` - Seconds with leading zeros (00 to 59)
 - `a` - ante/post meridem (am or pm)
 - `A` - uppercase ante/post meridem (AM or PM)
 - `U` - Unix timestamp in seconds (for example, 1325294640)
 - `c` - Iso time format (for example, 2011-12-31T01:24:00.000Z)

Escaping
---

You can escape characters by adding a backslash to them. In string literals, of course, that would be double backslash:

    var date = new Date('Feb 2, 2015 03:24:00');
    console.log(date_format(date, 'To\\d\\a\\y \\i\\s jS M, Y'));
    // Today is 2nd Feb, 2015
    
If you need a backslash itself in a pattern... I feel sorry for you. Not in this version. Actually you should not pass
huge strings as format, so I believe it is fine.

No-conflict
---

You can get rid of the lib from global scope. In case something else called date_format should be there, maybe. Or just
if you are pedantic, whatever. You can call the date_format.noConflict() function, which fill remove the date_format
from global scope, restore previous value (if any) and return the library itself so you can assign it to whatever you
want.

Customizing
---

Yeah, that is pretty stupid, but you can add own localization or something. Like this:

    date_format.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    date_format.months = [
      'January', 'February', 'March', 'April', 'May', 'June', 'Jule','August', 'September', 'October',
      'November', 'December'
    ];
    date_format.ordinalSuffix = function (n) {
      return ["th", "st", "nd", "rd"][(n = ~~ (n < 0 ? -n : n) % 100) > 10 && n < 14 || (n %= 10) > 3 ? 0 : n];
    };

ordinalSuffix is a function used for month day suffix (`S` identifier). Currently the one written by Dave Furfero from
[here](https://gist.github.com/furf/986113#file-annotated-js) is used, but you can replace it with your own.

    date_format.days = ['Воскресенье',' Понедельник', 'Вторник', 'Среда','Четверг','Пятница', 'Суббота'];
    date_format.months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль','Август', 'Сентябрь', 'Оттябрь',
      'Ноябрь', 'Декабрь'
    ];
    dafe_format.ordinalSuffix = function(){
    
    }

Node.js
---
In Node you use it like this:

    var date_format = require('date_format');

(After installing via NPM, using `npm install date_format`, of course)