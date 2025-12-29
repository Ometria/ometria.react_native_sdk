/**
 * Metro configuration for Expo
 *
 * The watchFolders config enables hot reloading when library source files change.
 * This is needed because Metro's file watcher doesn't always follow symlinks.
 */

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Watch the parent directory for hot reloading during local development
config.watchFolders = [path.resolve(__dirname, '..')];

module.exports = config;
