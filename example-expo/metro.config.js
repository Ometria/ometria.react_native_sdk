/**
 * Metro configuration for Expo
 *
 * This config enables local development with the symlinked react-native-ometria package.
 *
 * - watchFolders: Enables hot reloading when library source files change
 * - blockList: Prevents Metro from using peer dependencies from the root's node_modules
 * - extraNodeModules: Redirects peer dependency resolution to this project's node_modules,
 *   ensuring Metro uses the correct versions when bundling the symlinked library
 */

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');

const modules = Object.keys({
  ...pak.peerDependencies,
});

const escape = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const config = getDefaultConfig(__dirname);

// Watch the parent directory for hot reloading during local development
config.watchFolders = [root];

// Block peer dependencies from root's node_modules to avoid duplicates
config.resolver.blockList = modules.map(
  (m) => new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
);

// Redirect peer dependencies to example-expo's node_modules
config.resolver.extraNodeModules = modules.reduce((acc, name) => {
  acc[name] = path.join(__dirname, 'node_modules', name);
  return acc;
}, {});

module.exports = config;
