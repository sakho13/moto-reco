const { getDefaultConfig } = require('@expo/metro-config');
const { default: exclusionList } = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Prevent react-native version conflicts from nested package node_modules.
// packages/ui has its own node_modules/react-native at an older version,
// which must not shadow the root's version.
config.resolver.blockList = exclusionList([
  new RegExp(`${monorepoRoot}/packages/[^/]+/node_modules/react-native/.*`),
]);

module.exports = config;
