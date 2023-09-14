'use strict';

const { selectAll, selectOne, is } = require('css-select');
const xastAdaptor = require('./css-select-adapter.js');

const cssSelectOptions = {
  xmlMode: true,
  adapter: xastAdaptor,
};

const querySelectorAll = (node, selector) => {
  return selectAll(selector, node, cssSelectOptions);
};
exports.querySelectorAll = querySelectorAll;

const querySelector = (node, selector) => {
  return selectOne(selector, node, cssSelectOptions);
};
exports.querySelector = querySelector;

const matches = (node, selector) => {
  return is(node, selector, cssSelectOptions);
};
exports.matches = matches;

const visitSkip = Symbol();
exports.visitSkip = visitSkip;

const visit = (node, visitor, parentNode) => {
  const callbacks = visitor[node.type];
  if (callbacks && callbacks.enter) {
    // @ts-ignore hard to infer
    const symbol = callbacks.enter(node, parentNode);
    if (symbol === visitSkip) {
      return;
    }
  }
  // visit root children
  if (node.type === 'root') {
    // copy children array to not loose cursor when children is spliced
    for (const child of node.children) {
      visit(child, visitor, node);
    }
  }
  // visit element children if still attached to parent
  if (node.type === 'element') {
    if (parentNode.children.includes(node)) {
      for (const child of node.children) {
        visit(child, visitor, node);
      }
    }
  }
  if (callbacks && callbacks.exit) {
    // @ts-ignore hard to infer
    callbacks.exit(node, parentNode);
  }
};
exports.visit = visit;

const detachNodeFromParent = (node, parentNode) => {
  // avoid splice to not break for loops
  parentNode.children = parentNode.children.filter((child) => child !== node);
};
exports.detachNodeFromParent = detachNodeFromParent;
