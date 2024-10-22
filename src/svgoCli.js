const fs = require("fs");
const process = require("process");
const svgo = require("./svgo.js");

try {
  const input = fs.readFileSync(0, {encoding: 'utf-8'});
  const output = svgo.optimize(input, svgo.defaultOptions);
  fs.writeFileSync(1, output, {encoding: 'utf-8', flush: true});
  process.exit(0);
} catch (cause) {
  console.error(cause);
  process.exit(1);
}
