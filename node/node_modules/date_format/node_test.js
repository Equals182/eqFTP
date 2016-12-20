var date_format = require('./');

date_format.extendPrototype();
var date = new Date('Feb 2, 2015')
console.log(date.format('M j, Y'));
console.log(date.format('T\\he j-S F of Y'));