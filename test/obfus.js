var obfus = require('../lib/obfus.js');

var key = 'abcdefg';
var ob = new obfus.Obfuscator(key);

var text = new Buffer('Hello world.');
var obfText = ob.obfuscate(text);
var unobfText = ob.explicit(obfText);

console.log(text.toString());
console.log(obfText);
console.log(unobfText.toString());
