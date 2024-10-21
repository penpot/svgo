'use strict';

const { createPreset } = require('../tools.js');

const removeDoctype = require('./removeDoctype.js');
const removeXMLProcInst = require('./removeXMLProcInst.js');
const removeComments = require('./removeComments.js');
const removeMetadata = require('./removeMetadata.js');
const removeEditorsNSData = require('./removeEditorsNSData.js');
const cleanupAttrs = require('./cleanupAttrs.js');
const mergeStyles = require('./mergeStyles.js');
const minifyStyles = require('./minifyStyles.js');
const cleanupIds = require('./cleanupIds.js');
const removeUselessDefs = require('./removeUselessDefs.js');
const cleanupNumericValues = require('./cleanupNumericValues.js');
const convertColors = require('./convertColors.js');
const removeUnknownsAndDefaults = require('./removeUnknownsAndDefaults.js');
const removeNonInheritableGroupAttrs = require('./removeNonInheritableGroupAttrs.js');
const removeUselessStrokeAndFill = require('./removeUselessStrokeAndFill.js');
const removeViewBox = require('./removeViewBox.js');
const cleanupEnableBackground = require('./cleanupEnableBackground.js');
const removeHiddenElems = require('./removeHiddenElems.js');
const removeEmptyText = require('./removeEmptyText.js');
const collapseGroups = require('./collapseGroups.js');
const removeEmptyAttrs = require('./removeEmptyAttrs.js');
const removeEmptyContainers = require('./removeEmptyContainers.js');
const mergePaths = require('./mergePaths.js');
const removeUnusedNS = require('./removeUnusedNS.js');
const sortDefsChildren = require('./sortDefsChildren.js');
const removeTitle = require('./removeTitle.js');
const removeDesc = require('./removeDesc.js');

const presetSafe = createPreset({
  name: 'safeAndFastPreset',
  plugins: [
    removeDoctype,
    removeXMLProcInst,
    removeComments,
    removeMetadata,
    removeEditorsNSData,
    cleanupAttrs,
    mergeStyles,
    cleanupIds,
    removeUselessDefs,
    cleanupNumericValues,
    convertColors,
    removeUnknownsAndDefaults,
    removeNonInheritableGroupAttrs,
    removeUselessStrokeAndFill,
    removeViewBox,
    cleanupEnableBackground,
    removeHiddenElems,
    removeEmptyText,
    collapseGroups,
    removeEmptyAttrs,
    removeEmptyContainers,
    removeUnusedNS,
    removeTitle,
    removeDesc,
  ],
});

module.exports = presetSafe;
