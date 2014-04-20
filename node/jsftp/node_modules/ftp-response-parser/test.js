var tape = require('tape');
var resumer = require('resumer');
var Parser = require('./');

tape('Parse multiline response 2', function(t) {
  var res = '150-This is the first line of a mark\n' +
    '123-This line does not end the mark;note the hyphen\n' +
    '150 This line ends the mark\n' +
    '226-This is the first line of the second response\n' +
    ' 226 This line does not end the response;note the leading space\n' +
    '226 This is the last line of the response, using code 226\n';

  var stream = resumer().queue(res).end();
  var parser = new Parser();
  stream.pipe(parser);

  var responses = [];
  parser.on('readable', function() {
    var line;
    while (line = parser.read()) {
      responses.push(line);
    }
  });

  parser.on('end', function() {
    t.equal(2, responses.length);

    t.equal(150, responses[0].code);
    t.equal(226, responses[1].code);

    t.equal(true, responses[0].isMark);
    t.equal(false, responses[1].isMark);

    t.equal('150-This is the first line of a mark\n' +
      '123-This line does not end the mark;note the hyphen\n' +
      '150 This line ends the mark', responses[0].text);

    t.equal('226-This is the first line of the second response\n' +
      ' 226 This line does not end the response;note the leading space\n' +
      '226 This is the last line of the response, using code 226',
      responses[1].text);

    t.end();
  });
});
