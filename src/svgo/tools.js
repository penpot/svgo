'use strict';

const { visit } = require('./xast.js');

/**
 * Convert a row of numbers to an optimized string view.
 *
 * @example
 * [0, -1, .5, .5] → "0-1 .5.5"
 */
exports.cleanupOutData = (data, params, command) => {
  let str = '';
  let delimiter;
  let prev;

  data.forEach((item, i) => {
    // space delimiter by default
    delimiter = ' ';

    // no extra space in front of first number
    if (i == 0) delimiter = '';

    // no extra space after 'arcto' command flags(large-arc and sweep flags)
    // a20 60 45 0 1 30 20 → a20 60 45 0130 20
    if (params.noSpaceAfterFlags && (command == 'A' || command == 'a')) {
      var pos = i % 7;
      if (pos == 4 || pos == 5) delimiter = '';
    }

    // remove floating-point numbers leading zeros
    // 0.5 → .5
    // -0.5 → -.5
    const itemStr = params.leadingZero
      ? removeLeadingZero(item)
      : item.toString();

    // no extra space in front of negative number or
    // in front of a floating number if a previous number is floating too
    if (
      params.negativeExtraSpace &&
      delimiter != '' &&
      (item < 0 || (itemStr.charAt(0) === '.' && prev % 1 !== 0))
    ) {
      delimiter = '';
    }
    // save prev item value
    prev = item;
    str += delimiter + itemStr;
  });
  return str;
};

/**
 * Remove floating-point numbers leading zero.
 *
 * @example
 * 0.5 → .5
 *
 * @example
 * -0.5 → -.5
 */
const removeLeadingZero = (num) => {
  var strNum = num.toString();

  if (0 < num && num < 1 && strNum.charAt(0) === '0') {
    strNum = strNum.slice(1);
  } else if (-1 < num && num < 0 && strNum.charAt(1) === '0') {
    strNum = strNum.charAt(0) + strNum.slice(2);
  }
  return strNum;
};
exports.removeLeadingZero = removeLeadingZero;


function invokePlugins(ast, info, plugins, overrides, globalOverrides) {
  for (const plugin of plugins) {
    const override = overrides == null ? null : overrides[plugin.name];
    if (override === false) {
      continue;
    }
    const params = { ...plugin.params, ...globalOverrides, ...override };
    const visitor = plugin.fn(ast, params, info);
    if (visitor != null) {
      visit(ast, visitor);
    }
  }
};

function createPreset({ name, plugins }) {
  return {
    name,
    fn: (ast, params, info) => {
      const { floatPrecision, overrides } = params;

      const globalOverrides = {};
      if (floatPrecision != null) {
        globalOverrides.floatPrecision = floatPrecision;
      }

      invokePlugins(ast, info, plugins, overrides, globalOverrides);
    },
  };
}

exports.invokePlugins = invokePlugins;
exports.createPreset = createPreset;
