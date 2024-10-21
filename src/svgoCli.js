const fs = require("fs");
const svgo = require("./svgo.js");
const input = fs.readFileSync(0, 'utf-8');
const output = svgo.optimize(input, svgo.defaultOptions);
process.stdout.write(output);
process.exit(0);
