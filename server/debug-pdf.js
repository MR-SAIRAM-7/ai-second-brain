const lib = require('pdf-parse');
console.log('Keys:', Object.keys(lib));
const PDFParse = lib.PDFParse;
console.log('PDFParse type:', typeof PDFParse);

if (typeof PDFParse === 'function') {
    // Check if it's a class
    console.log('Is class?', PDFParse.toString().substring(0, 5) === 'class');
    console.log('Prototype methods:', Object.getOwnPropertyNames(PDFParse.prototype));
    console.log('Static methods:', Object.getOwnPropertyNames(PDFParse));
}
