const path = require('path');

module.exports = {
  root: true,
  extends: '@react-native',
  // Explicit path needed when ESLint runs from parent directory (e.g., IDE workspace root)
  parserOptions: {
    babelOptions: {
      configFile: path.join(__dirname, 'babel.config.js'),
    },
  },
  rules: {
    '@react-native/no-deep-imports': 'off',
  },
};
