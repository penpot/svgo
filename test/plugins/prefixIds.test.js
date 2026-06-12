'use strict';

const { optimize } = require('../../src/svgo.js');

test('should extract prefix from path basename', () => {
  const svg = `<svg id="my-id"></svg>`;
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
    }),
  ).toEqual(`<svg id="prefix__my-id"/>`);
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
      path: 'input.svg',
    }),
  ).toEqual(`<svg id="input_svg__my-id"/>`);
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
      path: 'path/to/input.svg',
    }),
  ).toEqual(`<svg id="input_svg__my-id"/>`);
});
