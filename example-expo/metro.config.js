/**
 * Metro configuration for Expo
 *
 * This config enables local development with the symlinked react-native-ometria package.
 * This is not needed if using the published versions of react-native-ometria package
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

// Block ALL of library's node_modules to prevent duplicate dependencies
// Critical for old architecture: NativeModules is per-bundle, so importing from
// a duplicate react-native results in empty NativeModules and app freeze
config.resolver.blockList = [
  new RegExp(`^${escape(path.join(root, 'node_modules'))}\\/.*$`),
];

// Redirect peer dependencies to example-expo's node_modules
config.resolver.extraNodeModules = modules.reduce((acc, name) => {
  acc[name] = path.join(__dirname, 'node_modules', name);
  return acc;
}, {});

module.exports = config;
