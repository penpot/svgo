'use strict';

const { visitSkip, detachNodeFromParent } = require('../xast.js');

exports.name = 'mergeStyles';
exports.description = 'merge multiple style elements into one';

/**
 * Merge multiple style elements into one.
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = () => {
  let firstStyleElement = null;
  let collectedStyles = '';
  let styleContentType = 'text';

  return {
    element: {
      enter: (node, parentNode) => {
        // skip <foreignObject> content
        if (node.name === 'foreignObject') {
          return visitSkip;
        }

        // collect style elements
        if (node.name !== 'style') {
          return;
        }

        // skip <style> with invalid type attribute
        if (
          node.attributes.type != null &&
          node.attributes.type !== '' &&
          node.attributes.type !== 'text/css'
        ) {
          return;
        }

        // extract style element content
        let css = '';
        for (const child of node.children) {
          if (child.type === 'text') {
            css += child.value;
          }
          if (child.type === 'cdata') {
            styleContentType = 'cdata';
            css += child.value;
          }
        }

        // remove empty style elements
        if (css.trim().length === 0) {
          detachNodeFromParent(node, parentNode);
          return;
        }

        // collect css and wrap with media query if present in attribute
        if (node.attributes.media == null) {
          collectedStyles += css;
        } else {
          collectedStyles += `@media ${node.attributes.media}{${css}}`;
          delete node.attributes.media;
        }

        // combine collected styles in the first style element
        if (firstStyleElement == null) {
          firstStyleElement = node;
        } else {
          detachNodeFromParent(node, parentNode);
          const child = { type: styleContentType, value: collectedStyles };
          // TODO remove legacy parentNode in v4
          Object.defineProperty(child, 'parentNode', {
            writable: true,
            value: firstStyleElement,
          });
          firstStyleElement.children = [child];
        }
      },
    },
  };
};
