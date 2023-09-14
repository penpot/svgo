'use strict';

const { builtin } = require('./builtin.js');

const isPlainObject = require("lodash/isPlainObject");
const isString = require("lodash/isString");

const pluginsMap = {};
for (const plugin of builtin) {
  pluginsMap[plugin.name] = plugin;
}

function resolvePlugin(plugin) {
  if (typeof plugin === 'string') {
    // resolve builtin plugin specified as string
    const builtinPlugin = pluginsMap[plugin];
    if (builtinPlugin == null) {
      throw Error(`Unknown builtin plugin "${plugin}" specified.`);
    }
    return {
      name: plugin,
      params: {},
      fn: builtinPlugin.fn,
    };
  }
  if (isPlainObject(plugin)) {
    if (!isString(plugin.name)) {
      throw Error(`Plugin name should be specified`);
    }
    // use custom plugin implementation
    let fn = plugin.fn;
    if (fn == null) {
      // resolve builtin plugin implementation
      const builtinPlugin = pluginsMap[plugin.name];
      if (builtinPlugin == null) {
        throw Error(`Unknown builtin plugin "${plugin.name}" specified.`);
      }
      fn = builtinPlugin.fn;
    }
    return {
      name: plugin.name,
      params: plugin.params,
      fn,
    };
  }
  return null;
}

exports.resolvePlugin = resolvePlugin;
