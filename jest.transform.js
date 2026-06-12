'use strict';

const { transformSync } = require('esbuild');

module.exports = {
  process(sourceText, sourcePath) {
    return {
      code: transformSync(sourceText, {
        loader: 'js',
        format: 'cjs',
        target: 'node16',
        sourcefile: sourcePath,
      }).code,
    };
  },
};
