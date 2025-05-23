'use strict';

const { detachNodeFromParent } = require('../xast.js');

exports.name = 'removeMetadata';
exports.description = 'removes <metadata>';

/**
 * Remove <metadata>.
 *
 * https://www.w3.org/TR/SVG11/metadata.html
 *
 * @author Kir Belevich
 */
exports.fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'metadata') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
