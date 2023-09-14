'use strict';

const { detachNodeFromParent } = require('../xast.js');

exports.name = 'removeXMLProcInst';
exports.description = 'removes XML processing instructions';

/**
 * Remove XML Processing Instruction.
 *
 * @example
 * <?xml version="1.0" encoding="utf-8"?>
 *
 * @author Kir Belevich
 */
exports.fn = () => {
  return {
    instruction: {
      enter: (node, parentNode) => {
        if (node.name === 'xml') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
