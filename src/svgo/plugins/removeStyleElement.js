'use strict';

const { detachNodeFromParent } = require('../xast.js');

exports.name = 'removeStyleElement';
exports.description = 'removes <style> element (disabled by default)';

/**
 * Remove <style>.
 *
 * https://www.w3.org/TR/SVG11/styling.html#StyleElement
 *
 * @author Betsy Dupuis
 */
exports.fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'style') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
