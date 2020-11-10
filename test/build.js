let argv = process.argv;
argv.splice(argv.length>2?3:2,0,"build");
require('../src/index.js')