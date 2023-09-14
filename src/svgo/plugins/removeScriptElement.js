'use strict';

const { detachNodeFromParent } = require('../xast.js');

exports.name = 'removeScriptElement';
exports.description = 'removes <script> elements (disabled by default)';

/**
 * Remove <script>.
 *
 * https://www.w3.org/TR/SVG11/script.html
 *
 * @author Patrick Klingemann
 */
exports.fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'script') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
