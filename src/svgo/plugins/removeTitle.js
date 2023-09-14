'use strict';

const { detachNodeFromParent } = require('../xast.js');

exports.name = 'removeTitle';
exports.description = 'removes <title>';

/**
 * Remove <title>.
 *
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title
 *
 * @author Igor Kalashnikov
 */
exports.fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'title') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
