'use strict';

const { optimize } = require('../../src/svgo.js');

describe('optimize() — fork API', () => {
  it('returns a string, not { data, error }', () => {
    const out = optimize('<svg><title>x</title></svg>', {});
    expect(typeof out).toBe('string');
    expect(out).toBe('<svg/>');
  });

  it('defaults to safePreset when plugins is omitted', () => {
    const svg = '<svg><title>x</title><desc>y</desc><metadata>z</metadata></svg>';
    const withDefaults = optimize(svg, {});
    const withSafePreset = optimize(svg, { plugins: ['safePreset'] });
    expect(withDefaults).toBe(withSafePreset);
  });

  it('rejects undefined config', () => {
    expect(() => optimize('<svg/>')).toThrow('Config should be an object');
  });

  it('rejects non-object config', () => {
    expect(() => optimize('<svg/>', 'nope')).toThrow('Config should be an object');
  });

  it('rejects non-array plugins', () => {
    expect(() => optimize('<svg/>', { plugins: 'safePreset' })).toThrow(
      'Invalid plugins list',
    );
  });
});

describe('multipass', () => {
  it('caps at 10 passes and threads multipassCount to plugins', () => {
    const counts = [];
    const out = optimize(
      '<svg id="abcdefghijklmnopqrstuvwxyz"></svg>',
      {
        multipass: true,
        plugins: [
          {
            name: 'shrinker',
            fn: (_root, _params, info) => {
              counts.push(info.multipassCount);
              return {
                element: {
                  enter: (node) => {
                    node.attributes.id = node.attributes.id.slice(1);
                  },
                },
              };
            },
          },
        ],
      },
    );
    expect(counts).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(out).toBe('<svg id="klmnopqrstuvwxyz"/>');
  });

  it('stops early when output size stops shrinking', () => {
    const counts = [];
    optimize('<svg><g><rect/></g></svg>', {
      multipass: true,
      plugins: [
        {
          name: 'counter',
          fn: (_root, _params, info) => {
            counts.push(info.multipassCount);
            return null;
          },
        },
      ],
    });
    // First pass: output < +Infinity, accepted. Second pass: output ==
    // prevResultSize, loop breaks. Plugin ran exactly twice.
    expect(counts).toEqual([0, 1]);
  });
});

describe('floatPrecision global override', () => {
  it('forwards floatPrecision to plugins that read it', () => {
    const svg = '<svg><circle cx="60.123456" cy="60" r="50"/></svg>';
    const defaulted = optimize(svg, { plugins: ['cleanupNumericValues'] });
    const tightened = optimize(svg, {
      plugins: ['cleanupNumericValues'],
      floatPrecision: 2,
    });
    expect(defaulted).toBe('<svg><circle cx="60.123" cy="60" r="50"/></svg>');
    expect(tightened).toBe('<svg><circle cx="60.12" cy="60" r="50"/></svg>');
  });
});

describe('parser errors', () => {
  it('throws SvgoParserError with reason/line/column populated', () => {
    let caught;
    try {
      optimize('<svg><circle fill="#ff0000" cx=60" cy="60" r="50"/></svg>', {
        path: 'test.svg',
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeDefined();
    expect(caught.name).toBe('SvgoParserError');
    expect(caught.reason).toBe('Unquoted attribute value');
    expect(caught.line).toBe(1);
    expect(caught.column).toBe(32);
    expect(caught.message).toBe('test.svg:1:32: Unquoted attribute value');
  });
});
