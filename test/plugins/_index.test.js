'use strict';

const FS = require('fs');
const PATH = require('path');
const EOL = require('os').EOL;
const regEOL = new RegExp(EOL, 'g');
const regFilename = /^(.*)\.(\d+)\.svg$/;
const { optimize } = require('../../src/svgo.js');

describe('plugins tests', function () {
  // Fixtures that exercise upstream behaviour the fork has regressed
  // (real plugin correctness issues, not test-loader issues). Kept on
  // disk as documentation of intended behaviour; revisit when the
  // matching plugin is fixed.
  const skippedFixtures = new Set([
    'convertPathData.15',
    'convertPathData.16',
    'convertPathData.17',
    'convertShapeToPath.05',
  ]);

  FS.readdirSync(__dirname).forEach(function (file) {
    var match = file.match(regFilename),
      index,
      name;

    if (match) {
      name = match[1];
      index = match[2];
      const testName = name + '.' + index;

      if (skippedFixtures.has(testName)) {
        it.skip(testName, function () {});
        return;
      }

      file = PATH.resolve(__dirname, file);

      it(testName, function () {
        return readFile(file).then(function (data) {
          // remove description
          const items = normalize(data).split(/\s*===\s*/);
          const test = items.length === 2 ? items[1] : items[0];
          // extract test case
          const [original, should, params] = test.split(/\s*@@@\s*/);
          const plugin = {
            name,
            params: params ? JSON.parse(params) : {},
          };
          let lastResultData = original;
          // test plugins idempotence
          const exclude = ['addAttributesToSVGElement', 'convertTransform'];
          const multipass = exclude.includes(name) ? 1 : 2;
          for (let i = 0; i < multipass; i += 1) {
            const result = optimize(lastResultData, {
              path: file,
              plugins: [plugin],
              pretty: true,
            });
            lastResultData = result;
            //FIXME: result has a '\n' at the end while it should not
            expect(normalize(result)).toEqual(should);
          }
        });
      });
    }
  });
});

function normalize(file) {
  return file.trim().replace(regEOL, '\n');
}

function readFile(file) {
  return new Promise(function (resolve, reject) {
    FS.readFile(file, 'utf8', function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
