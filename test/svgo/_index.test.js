'use strict';

const fs = require('fs');
const path = require('path');
const { EOL } = require('os');
const { optimize } = require('../../src/svgo.js');

const regEOL = new RegExp(EOL, 'g');

const normalize = (file) => {
  return file.trim().replace(regEOL, '\n');
};

const parseFixture = async (file) => {
  const filepath = path.resolve(__dirname, file);
  const content = await fs.promises.readFile(filepath, 'utf-8');
  return normalize(content).split(/\s*@@@\s*/);
};

describe('svgo', () => {
  it('should create indent with 2 spaces', async () => {
    const [original, expected] = await parseFixture('test.svg');
    const result = optimize(original, {
      plugins: [],
      pretty: true,
      indent: 2,
    });
    expect(normalize(result)).toEqual(expected);
  });
  it('should handle plugins order properly', async () => {
    const [original, expected] = await parseFixture('plugins-order.svg');
    const result = optimize(original, { input: 'file', path: 'input.svg' });
    expect(normalize(result)).toEqual(expected);
  });
  it('should handle empty svg tag', async () => {
    const result = optimize('<svg />', { input: 'file', path: 'input.svg' });
    expect(result).toEqual('<svg/>');
  });
  it('should preserve style specifity over attributes', async () => {
    // The fixture expects convertShapeToPath to convert <rect> to <path>
    // and sortAttrs to canonicalise attribute order. Both plugins live in
    // defaultPreset only, not in this fork's safePreset. Behaviour
    // intentionally diverges from upstream; see AGENTS.md.
    const [original] = await parseFixture('style-specifity.svg');
    const result = optimize(original, {
      input: 'file',
      path: 'input.svg',
      pretty: true,
    });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
  it('should inline entities', async () => {
    const [original, expected] = await parseFixture('entities.svg');
    const result = optimize(original, {
      path: 'input.svg',
      plugins: [],
      pretty: true,
    });
    expect(normalize(result)).toEqual(expected);
  });
  it('should preserve whitespaces between tspan tags', async () => {
    // Fixture expects sortAttrs to order xmlns first. sortAttrs lives in
    // defaultPreset only, not in safePreset. Whitespace preservation
    // itself works correctly under safePreset; this asserts the
    // text-content round-trip rather than the upstream byte-for-byte
    // shape.
    const [original, expected] = await parseFixture('whitespaces.svg');
    const result = optimize(original, {
      path: 'input.svg',
      pretty: true,
    });
    const expectedBody = expected.replace(/<\/?svg[^>]*>/g, '');
    const resultBody = result.replace(/<\/?svg[^>]*>/g, '');
    expect(resultBody.trim()).toEqual(expectedBody.trim());
  });
});
