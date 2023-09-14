'use strict';

const csstree = require('css-tree');
const {
  syntax: { specificity },
} = require('csso');
const { visit, matches } = require('./xast.js');
const {
  attrsGroups,
  inheritableAttrs,
  presentationNonInheritableGroupAttrs,
} = require('./plugins/_collections.js');

const csstreeWalkSkip = csstree.walk.skip;

const parseRule = (ruleNode, dynamic) => {
  const declarations = [];
  // collect declarations
  ruleNode.block.children.forEach((cssNode) => {
    if (cssNode.type === 'Declaration') {
      declarations.push({
        name: cssNode.property,
        value: csstree.generate(cssNode.value),
        important: cssNode.important === true,
      });
    }
  });

  const rules = [];
  csstree.walk(ruleNode.prelude, (node) => {
    if (node.type === 'Selector') {
      const newNode = csstree.clone(node);
      let hasPseudoClasses = false;
      csstree.walk(newNode, (pseudoClassNode, item, list) => {
        if (pseudoClassNode.type === 'PseudoClassSelector') {
          hasPseudoClasses = true;
          list.remove(item);
        }
      });
      rules.push({
        specificity: specificity(node),
        dynamic: hasPseudoClasses || dynamic,
        // compute specificity from original node to consider pseudo classes
        selector: csstree.generate(newNode),
        declarations,
      });
    }
  });

  return rules;
};

const parseStylesheet = (css, dynamic) => {
  const rules = [];
  const ast = csstree.parse(css, {
    parseValue: false,
    parseAtrulePrelude: false,
  });
  csstree.walk(ast, (cssNode) => {
    if (cssNode.type === 'Rule') {
      rules.push(...parseRule(cssNode, dynamic || false));
      return csstreeWalkSkip;
    }
    if (cssNode.type === 'Atrule') {
      if (cssNode.name === 'keyframes') {
        return csstreeWalkSkip;
      }
      csstree.walk(cssNode, (ruleNode) => {
        if (ruleNode.type === 'Rule') {
          rules.push(...parseRule(ruleNode, dynamic || true));
          return csstreeWalkSkip;
        }
      });
      return csstreeWalkSkip;
    }
  });
  return rules;
};

const parseStyleDeclarations = (css) => {
  const declarations = [];
  const ast = csstree.parse(css, {
    context: 'declarationList',
    parseValue: false,
  });
  csstree.walk(ast, (cssNode) => {
    if (cssNode.type === 'Declaration') {
      declarations.push({
        name: cssNode.property,
        value: csstree.generate(cssNode.value),
        important: cssNode.important === true,
      });
    }
  });
  return declarations;
};

const computeOwnStyle = (stylesheet, node) => {
  const computedStyle = {};
  const importantStyles = new Map();

  // collect attributes
  for (const [name, value] of Object.entries(node.attributes)) {
    if (attrsGroups.presentation.includes(name)) {
      computedStyle[name] = { type: 'static', inherited: false, value };
      importantStyles.set(name, false);
    }
  }

  // collect matching rules
  for (const { selector, declarations, dynamic } of stylesheet.rules) {
    if (matches(node, selector)) {
      for (const { name, value, important } of declarations) {
        const computed = computedStyle[name];
        if (computed && computed.type === 'dynamic') {
          continue;
        }
        if (dynamic) {
          computedStyle[name] = { type: 'dynamic', inherited: false };
          continue;
        }
        if (
          computed == null ||
          important === true ||
          importantStyles.get(name) === false
        ) {
          computedStyle[name] = { type: 'static', inherited: false, value };
          importantStyles.set(name, important);
        }
      }
    }
  }

  // collect inline styles
  const styleDeclarations =
    node.attributes.style == null
      ? []
      : parseStyleDeclarations(node.attributes.style);
  for (const { name, value, important } of styleDeclarations) {
    const computed = computedStyle[name];
    if (computed && computed.type === 'dynamic') {
      continue;
    }
    if (
      computed == null ||
      important === true ||
      importantStyles.get(name) === false
    ) {
      computedStyle[name] = { type: 'static', inherited: false, value };
      importantStyles.set(name, important);
    }
  }

  return computedStyle;
};

/**
 * Compares two selector specificities.
 * extracted from https://github.com/keeganstreet/specificity/blob/main/specificity.js#L211
 */
const compareSpecificity = (a, b) => {
  for (let i = 0; i < 4; i += 1) {
    if (a[i] < b[i]) {
      return -1;
    } else if (a[i] > b[i]) {
      return 1;
    }
  }

  return 0;
};

const collectStylesheet = (root) => {
  const rules = [];
  const parents = new Map();
  visit(root, {
    element: {
      enter: (node, parentNode) => {
        // store parents
        parents.set(node, parentNode);
        // find and parse all styles
        if (node.name === 'style') {
          const dynamic =
            node.attributes.media != null && node.attributes.media !== 'all';
          if (
            node.attributes.type == null ||
            node.attributes.type === '' ||
            node.attributes.type === 'text/css'
          ) {
            const children = node.children;
            for (const child of children) {
              if (child.type === 'text' || child.type === 'cdata') {
                rules.push(...parseStylesheet(child.value, dynamic));
              }
            }
          }
        }
      },
    },
  });
  // sort by selectors specificity
  rules.sort((a, b) => compareSpecificity(a.specificity, b.specificity));
  return { rules, parents };
};
exports.collectStylesheet = collectStylesheet;

const computeStyle = (stylesheet, node) => {
  const { parents } = stylesheet;
  // collect inherited styles
  const computedStyles = computeOwnStyle(stylesheet, node);
  let parent = parents.get(node);
  while (parent != null && parent.type !== 'root') {
    const inheritedStyles = computeOwnStyle(stylesheet, parent);
    for (const [name, computed] of Object.entries(inheritedStyles)) {
      if (
        computedStyles[name] == null &&
        // ignore not inheritable styles
        inheritableAttrs.includes(name) === true &&
        presentationNonInheritableGroupAttrs.includes(name) === false
      ) {
        computedStyles[name] = { ...computed, inherited: true };
      }
    }
    parent = parents.get(parent);
  }
  return computedStyles;
};
exports.computeStyle = computeStyle;
