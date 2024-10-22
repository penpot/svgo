'use strict';

const { parseSvg } = require('./svgo/parser.js');
const { stringifySvg } = require('./svgo/stringifier.js');
const { resolvePlugin } = require('./svgo/plugins.js');
const { invokePlugins } = require('./svgo/tools.js');

const isPlainObject = require("lodash/isPlainObject");

const optimize = (input, config) => {
  if (config === null) {
    config = {};
  }

  if (!isPlainObject(config)) {
    throw Error('Config should be an object');
  }

  let plugins = config.plugins || ['safePreset'];

  if (Array.isArray(plugins) === false) {
    throw Error("Invalid plugins list");
  }

  plugins = plugins.map(resolvePlugin);

  const globalOverrides = {};
  if (config.floatPrecision !== null) {
    globalOverrides.floatPrecision = config.floatPrecision;
  }

  let maxPassCount = config.multipass ? 10 : 1;
  let prevResultSize = Number.POSITIVE_INFINITY;
  let output = '';
  let info = {};

  for (let i = 0; i < maxPassCount; i += 1) {
    info.multipassCount = i;
    const ast = parseSvg(input, config.path);
    invokePlugins(ast, info, plugins, null, globalOverrides);
    output = stringifySvg(ast, config);

    if (output.length < prevResultSize) {
      input = output;
      prevResultSize = output.length;
    } else {
      break;
    }
  }

  return output;
};

exports.optimize = optimize;

const defaultOptions = {
  multipass: false,
  plugins: ['safeAndFastPreset']
};

exports.defaultOptions = defaultOptions;

