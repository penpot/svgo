'use strict';

const esmPackages = [
  'css-select',
  'boolbase',
  'css-what',
  'dom-serializer',
  'domelementtype',
  'domhandler',
  'domutils',
  'entities',
  'nth-check',
].join('|');

module.exports = {
  transform: {
    '^.+\\.m?js$': '<rootDir>/jest.transform.js',
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:${esmPackages})/)`,
  ],
};

